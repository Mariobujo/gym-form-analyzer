"""
Utilidades de seguridad y autenticación
"""
import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 horas

# Context para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token scheme
security = HTTPBearer()

def get_mysql_connection():
    """Obtener conexión a MySQL"""
    try:
        config = {
            'host': os.getenv("DB_HOST", "localhost"),
            'port': int(os.getenv("DB_PORT", "3306")),
            'user': os.getenv("DB_USER", "root"),
            'password': os.getenv("DB_PASSWORD", ""),
            'database': os.getenv("DB_NAME", "gymform_analyzer"),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci'
        }
        return mysql.connector.connect(**config)
    except mysql.connector.Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

def hash_password(password: str) -> str:
    """Hash de contraseña"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Crear token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verificar token JWT"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

async def get_current_user(user_id: int = Depends(verify_token)):
    """Obtener usuario actual"""
    connection = get_mysql_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de conexión a base de datos"
        )
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s AND is_active = TRUE", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return user
    finally:
        cursor.close()
        connection.close()

def authenticate_user(username: str, password: str):
    """Autenticar usuario"""
    connection = get_mysql_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM users WHERE username = %s AND is_active = TRUE", 
            (username,)
        )
        user = cursor.fetchone()
        
        if not user:
            return False
        
        if not verify_password(password, user['password_hash']):
            return False
        
        return user
    finally:
        cursor.close()
        connection.close()