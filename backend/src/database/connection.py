"""
Configuración de conexión a la base de datos MySQL
"""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "gymform_analyzer")

# URL de conexión a MySQL
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"🔗 Conectando a: mysql://{DB_USER}:****@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Crear engine de SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Muestra las consultas SQL en desarrollo
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_recycle=3600,  # Recicla conexiones cada hora
)

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# =====================================
# FUNCIONES DE CONEXIÓN
# =====================================

def get_database_session():
    """
    Obtener sesión de base de datos
    Para usar en dependencias de FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    """
    Probar conexión a la base de datos
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Conexión a MySQL exitosa!")
            return True
    except Exception as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return False

def create_database_if_not_exists():
    """
    Crear la base de datos si no existe
    """
    try:
        # Conexión sin especificar base de datos
        temp_url = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}"
        temp_engine = create_engine(temp_url)
        
        with temp_engine.connect() as connection:
            # Verificar si la base de datos existe
            result = connection.execute(
                text(f"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '{DB_NAME}'")
            )
            
            if not result.fetchone():
                # Crear la base de datos
                connection.execute(text(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                print(f"✅ Base de datos '{DB_NAME}' creada exitosamente!")
            else:
                print(f"✅ Base de datos '{DB_NAME}' ya existe!")
                
        temp_engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Error creando base de datos: {e}")
        return False

def initialize_database():
    """
    Inicializar la base de datos completa
    """
    print("🚀 Inicializando base de datos...")
    
    # 1. Crear base de datos si no existe
    if not create_database_if_not_exists():
        return False
    
    # 2. Probar conexión
    if not test_connection():
        return False
    
    # 3. Crear tablas (cuando tengamos los modelos)
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas/verificadas exitosamente!")
        return True
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False