"""
Rutas de autenticación
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
import mysql.connector
from ..models.user_models import UserCreate, UserLogin, UserResponse, Token
from ..utils.security import (
    hash_password, authenticate_user, create_access_token, 
    get_current_user, get_mysql_connection, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=Token)
async def register_user(user_data: UserCreate):
    """Registrar nuevo usuario"""
    connection = get_mysql_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de conexión a base de datos"
        )
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Verificar si el usuario ya existe
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                      (user_data.username, user_data.email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario o email ya existe"
            )
        
        # Hash de la contraseña
        hashed_password = hash_password(user_data.password)
        
        # Insertar nuevo usuario
        insert_query = """
        INSERT INTO users (username, email, password_hash, first_name, last_name, 
                          height, weight, fitness_level) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            user_data.username,
            user_data.email,
            hashed_password,
            user_data.first_name,
            user_data.last_name,
            user_data.height,
            user_data.weight,
            user_data.fitness_level
        ))
        
        user_id = cursor.lastrowid
        connection.commit()
        
        # Obtener usuario creado
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        new_user = cursor.fetchone()
        
        # Crear token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user["id"])}, 
            expires_delta=access_token_expires
        )
        
        user_response = UserResponse(**new_user)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except mysql.connector.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

@router.post("/login", response_model=Token)
async def login_user(login_data: UserLogin):
    """Login de usuario"""
    user = authenticate_user(login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["id"])}, 
        expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return UserResponse(**current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Actualizar información del usuario actual"""
    connection = get_mysql_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de conexión a base de datos"
        )
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Construir query de actualización dinámicamente
        allowed_fields = ['first_name', 'last_name', 'height', 'weight', 'fitness_level']
        updates = []
        values = []
        
        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay campos válidos para actualizar"
            )
        
        values.append(current_user['id'])
        
        update_query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(update_query, values)
        connection.commit()
        
        # Obtener usuario actualizado
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user['id'],))
        updated_user = cursor.fetchone()
        
        return UserResponse(**updated_user)
        
    except mysql.connector.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()