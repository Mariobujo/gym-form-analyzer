### **PASO 5: Actualizar Componentes del Frontend**

#### frontend/src/pages/LoginPage.jsx (Actualizado)
```javascript
/**
 * GymForm Analyzer - Login Page con Autenticación Real
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Lock, Activity, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { authService, validateUserRegistration } from '../services/api';

const LoginPage = ({ onLoginSuccess, systemInfo }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmitLogin = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('🔑 Intentando login:', data.username);
      
      const result = await authService.login({
        username: data.username,
        password: data.password
      });
      
      if (result.success) {
        onLoginSuccess(result.data.user);
      } else {
        toast.error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      toast.error('Error de inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRegister = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('📝 Intentando registro:', data.username);
      
      // Validar datos de registro
      const validation = validateUserRegistration(data);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        setIsLoading(false);
        return;
      }

      const result = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        fitness_level: data.fitness_level || 'beginner'
      });
      
      if (result.success) {
        onLoginSuccess(result.data.user);
      } else {
        toast.error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      toast.error('Error creando cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    reset();
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Activity size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            GymForm Analyzer
          </h1>
          <p className="mt-2 text-gray-600">
            Análisis de técnica de ejercicios con IA
          </p>
          
          {/* Estado del sistema */}
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-white border rounded-lg shadow-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              systemInfo?.allConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {systemInfo?.allConnected ? 'Sistema conectado' : 'Sistema desconectado'}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => !isRegisterMode || toggleMode()}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  !isRegisterMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => isRegisterMode || toggleMode()}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  isRegisterMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Registrarse
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(isRegisterMode ? onSubmitRegister : onSubmitLogin)} className="space-y-6">
            
            {/* Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('username', { 
                    required: 'El usuario es requerido',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                  })}
                  type="text"
                  className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isRegisterMode ? "usuario123" : "test_user"}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email (solo registro) */}
            {isRegisterMode && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    {...register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="usuario@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            )}

            {/* Nombre y Apellido (solo registro) */}
            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    {...register('first_name')}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    {...register('last_name')}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}

            {/* Datos físicos (solo registro) */}
            {isRegisterMode && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                    Altura (cm)
                  </label>
                  <input
                    {...register('height')}
                    type="number"
                    min="100"
                    max="250"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="175"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                    Peso (kg)
                  </label>
                  <input
                    {...register('weight')}
                    type="number"
                    min="30"
                    max="300"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="70"
                  />
                </div>
                <div>
                  <label htmlFor="fitness_level" className="block text-sm font-medium text-gray-700">
                    Nivel
                  </label>
                  <select
                    {...register('fitness_level')}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>
            )}

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  {...register('password', { 
                    required: 'La contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isRegisterMode ? "mínimo 6 caracteres" : "test123"}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={isLoading || !systemInfo?.allConnected}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 # GymForm Analyzer - Integración Completa Backend + Base de Datos

## 🎯 Objetivo
Conectar completamente el frontend con el backend y base de datos MySQL para crear un sistema de persistencia de datos real con autenticación básica y estadísticas históricas.

## 📋 Funcionalidades a Implementar

### 1. **Sistema de Usuarios Básico**
- Registro de usuarios simples
- Login/logout funcional
- Sesiones persistentes con JWT
- Perfil básico de usuario

### 2. **Persistencia de Datos Real**
- Guardar sesiones de entrenamiento en MySQL
- Historial de progreso persistente
- Estadísticas históricas y trends
- Datos de pose y ángulos en base de datos

### 3. **API Endpoints Funcionales**
- Autenticación completa
- CRUD de sesiones de workout
- Estadísticas de progreso
- Gestión de usuarios

---

## 🔧 Implementación Detallada

### **PASO 1: Actualizar Backend - Sistema de Autenticación**

#### backend/src/models/user_models.py
```python
"""
Modelos Pydantic para usuarios
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    height: Optional[float] = Field(None, ge=100, le=250)  # cm
    weight: Optional[float] = Field(None, ge=30, le=300)   # kg
    fitness_level: Optional[str] = Field("beginner", regex="^(beginner|intermediate|advanced)$")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    fitness_level: str
    created_at: datetime
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
```

#### backend/src/utils/security.py
```python
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
```

#### backend/src/api/auth_routes.py
```python
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
```

### **PASO 2: Actualizar Rutas de Workout con Autenticación**

#### backend/src/api/workout_routes.py (Actualizado)
```python
"""
Rutas de workout con autenticación
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, date
import json
import mysql.connector
from ..utils.security import get_current_user

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

# ... (mantener modelos existentes y agregar nuevos)

class WorkoutSessionCreateWithPose(BaseModel):
    exercise_type: str = Field(..., description="Tipo de ejercicio")
    duration_seconds: int = Field(..., gt=0, description="Duración en segundos")
    technique_score: float = Field(..., ge=0, le=100, description="Puntuación de técnica")
    accuracy_percentage: float = Field(..., ge=0, le=100, description="Porcentaje de precisión")
    total_frames: int = Field(..., ge=0, description="Total de frames procesados")
    good_frames: int = Field(..., ge=0, description="Frames con buena técnica")
    avg_angles: Dict[str, float] = Field(default_factory=dict, description="Ángulos promedio")
    pose_data: Optional[str] = Field(None, description="Datos de pose en JSON")
    angle_history: Optional[List[Dict]] = Field(None, description="Historial de ángulos")
    feedback: Optional[List[str]] = Field(None, description="Feedback generado")
    session_notes: Optional[str] = Field(None, description="Notas de la sesión")

@router.post("/sessions", response_model=Dict[str, Any])
async def create_workout_session_authenticated(
    session_data: WorkoutSessionCreateWithPose,
    current_user: dict = Depends(get_current_user)
):
    """Crear nueva sesión de entrenamiento (autenticada)"""
    
    connection = get_mysql_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo conectar a la base de datos"
        )
            
    try:
        cursor = connection.cursor(dictionary=True)
        
        # 1. Crear sesión principal
        session_query = """
        INSERT INTO workout_sessions (
            user_id, session_name, start_time, end_time, 
            duration_minutes, average_score, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        start_time = datetime.now()
        end_time = start_time
        duration_minutes = session_data.duration_seconds / 60
        
        cursor.execute(session_query, (
            current_user['id'],  # Usar ID del usuario autenticado
            f"Sesión {session_data.exercise_type}",
            start_time,
            end_time,
            duration_minutes,
            session_data.technique_score,
            session_data.session_notes or ""
        ))
        
        session_id = cursor.lastrowid
        
        # 2. Buscar o crear tipo de ejercicio
        exercise_type_id = await get_or_create_exercise_type(
            cursor, session_data.exercise_type
        )
        
        # 3. Crear registro de performance con datos de pose
        performance_query = """
        INSERT INTO exercise_performances (
            session_id, exercise_type_id, user_id, set_number,
            repetitions, technique_score, avg_knee_angle, avg_hip_angle,
            avg_shoulder_angle, avg_elbow_angle, movement_speed,
            stability_score, symmetry_score, pose_data,
            angle_history, feedback
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        angles = session_data.avg_angles
        
        cursor.execute(performance_query, (
            session_id,
            exercise_type_id,
            current_user['id'],
            1,  # set_number
            session_data.total_frames,
            session_data.technique_score,
            angles.get('leftKnee'),
            angles.get('leftHip'),
            angles.get('leftShoulder'),
            angles.get('leftElbow'),
            None,  # movement_speed
            session_data.accuracy_percentage,
            100.0,  # symmetry_score default
            session_data.pose_data,
            json.dumps(session_data.angle_history or []),
            json.dumps(session_data.feedback or [])
        ))
        
        connection.commit()
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "Sesión guardada correctamente",
            "user_id": current_user['id'],
            "data": {
                "id": session_id,
                "exercise_type": session_data.exercise_type,
                "duration_seconds": session_data.duration_seconds,
                "technique_score": session_data.technique_score,
                "accuracy_percentage": session_data.accuracy_percentage,
                "pose_analysis": True
            }
        }
        
    except mysql.connector.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

@router.get("/sessions", response_model=List[Dict[str, Any]])
async def get_user_sessions_authenticated(
    limit: int = 10,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Obtener sesiones del usuario autenticado"""
    
    connection = get_mysql_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo conectar a la base de datos"
        )
            
    try:
        cursor = connection.cursor(dictionary=True)
        
        query = """
        SELECT 
            ws.id,
            ws.session_name,
            ws.start_time,
            ws.end_time,
            ws.duration_minutes,
            ws.average_score,
            ws.notes,
            ws.created_at,
            et.name as exercise_name,
            ep.technique_score,
            ep.avg_knee_angle,
            ep.avg_hip_angle,
            ep.avg_shoulder_angle,
            ep.avg_elbow_angle,
            ep.stability_score,
            ep.pose_data,
            ep.angle_history,
            ep.feedback
        FROM workout_sessions ws
        LEFT JOIN exercise_performances ep ON ws.id = ep.session_id
        LEFT JOIN exercise_types et ON ep.exercise_type_id = et.id
        WHERE ws.user_id = %s
        ORDER BY ws.created_at DESC
        LIMIT %s OFFSET %s
        """
        
        cursor.execute(query, (current_user['id'], limit, offset))
        sessions = cursor.fetchall()
        
        # Procesar y enriquecer resultados
        result = []
        for session in sessions:
            session_data = {
                "id": session['id'],
                "exercise_type": session['exercise_name'] or 'general',
                "duration_seconds": int(session['duration_minutes'] * 60),
                "technique_score": session['technique_score'] or session['average_score'],
                "created_at": session['created_at'],
                "has_pose_data": bool(session['pose_data']),
                "angles": {
                    "knee": session['avg_knee_angle'],
                    "hip": session['avg_hip_angle'],
                    "shoulder": session['avg_shoulder_angle'],
                    "elbow": session['avg_elbow_angle']
                },
                "stability_score": session['stability_score'],
                "feedback": json.loads(session['feedback']) if session['feedback'] else []
            }
            result.append(session_data)
        
        return result
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

@router.get("/stats/advanced")
async def get_advanced_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Estadísticas avanzadas del usuario"""
    
    connection = get_mysql_connection()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo conectar a la base de datos"
        )
            
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Estadísticas generales
        general_stats_query = """
        SELECT 
            COUNT(DISTINCT ws.id) as total_sessions,
            AVG(ws.average_score) as avg_score,
            MAX(ws.average_score) as best_score,
            SUM(ws.duration_minutes) as total_minutes,
            COUNT(CASE WHEN ep.pose_data IS NOT NULL THEN 1 END) as sessions_with_pose
        FROM workout_sessions ws
        LEFT JOIN exercise_performances ep ON ws.id = ep.session_id
        WHERE ws.user_id = %s 
        AND ws.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """
        
        cursor.execute(general_stats_query, (current_user['id'], days))
        general_stats = cursor.fetchone()
        
        # Progreso por ejercicio
        exercise_progress_query = """
        SELECT 
            et.name as exercise_name,
            COUNT(ep.id) as total_performances,
            AVG(ep.technique_score) as avg_score,
            MAX(ep.technique_score) as best_score,
            AVG(ep.avg_knee_angle) as avg_knee_angle,
            AVG(ep.stability_score) as avg_stability
        FROM exercise_performances ep
        JOIN exercise_types et ON ep.exercise_type_id = et.id
        JOIN workout_sessions ws ON ep.session_id = ws.id
        WHERE ws.user_id = %s 
        AND ws.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY et.id, et.name
        ORDER BY total_performances DESC
        """
        
        cursor.execute(exercise_progress_query, (current_user['id'], days))
        exercise_progress = cursor.fetchall()
        
        # Tendencia semanal
        weekly_trend_query = """
        SELECT 
            YEARWEEK(ws.created_at) as week,
            COUNT(ws.id) as sessions_count,
            AVG(ws.average_score) as avg_score
        FROM workout_sessions ws
        WHERE ws.user_id = %s 
        AND ws.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY YEARWEEK(ws.created_at)
        ORDER BY week
        """
        
        cursor.execute(weekly_trend_query, (current_user['id'], days))
        weekly_trend = cursor.fetchall()
        
        return {
            "user_id": current_user['id'],
            "period_days": days,
            "general_stats": general_stats,
            "exercise_progress": exercise_progress,
            "weekly_trend": weekly_trend,
            "pose_analysis_available": general_stats['sessions_with_pose'] > 0
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        cursor.close()
        connection.close()

# Función auxiliar (mantener la existente y actualizar)
async def get_or_create_exercise_type(cursor, exercise_name: str) -> int:
    """Obtener o crear tipo de ejercicio"""
    cursor.execute("SELECT id FROM exercise_types WHERE name = %s", (exercise_name,))
    result = cursor.fetchone()
    
    if result:
        return result['id']
    
    insert_query = """
    INSERT INTO exercise_types (name, description, category, difficulty_level)
    VALUES (%s, %s, %s, %s)
    """
    
    cursor.execute(insert_query, (
        exercise_name,
        f"Ejercicio {exercise_name} - análisis con IA",
        "strength",
        "beginner"
    ))
    
    return cursor.lastrowid
```

### **PASO 3: Actualizar Main.py del Backend**

#### backend/main.py (Actualizado)
```python
"""
GymForm Analyzer - Backend Principal con Autenticación
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# Importar rutas
from src.api.workout_routes import router as workout_router
from src.api.auth_routes import router as auth_router  # NUEVO

# Cargar variables de entorno
load_dotenv()

# Crear instancia de FastAPI
app = FastAPI(
    title="GymForm Analyzer API",
    version="2.0.0",
    description="API completa para análisis de técnica en ejercicios con autenticación",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# =====================================
# INCLUIR ROUTERS
# =====================================

app.include_router(auth_router)      # NUEVO
app.include_router(workout_router)

# ... (mantener el resto del código existente)

@app.get("/")
async def root():
    return {
        "message": "¡GymForm Analyzer API v2.0 - Con Autenticación!",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "features": [
            "✅ Autenticación JWT",
            "✅ Registro de usuarios",
            "✅ Análisis de pose con IA",
            "✅ Persistencia en MySQL",
            "✅ Estadísticas avanzadas"
        ]
    }

# ... (mantener el resto del código)
```

### **PASO 4: Actualizar Frontend - Servicio de API**

#### frontend/src/services/api.js (Actualizado)
```javascript
/**
 * GymForm Analyzer - API Service con Autenticación
 */
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'fake-jwt-token-for-development') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error);
    
    if (error.response?.status === 401) {
      toast.error('Sesión expirada. Inicia sesión nuevamente.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para esta acción');
    } else if (error.response?.status === 404) {
      toast.error('Recurso no encontrado');
    } else if (error.response?.status === 500) {
      toast.error('Error interno del servidor');
    } else if (error.message === 'Network Error') {
      toast.error('Error de conexión. ¿Está el backend funcionando?');
    }
    
    return Promise.reject(error);
  }
);

// =====================================
// SERVICIOS DE AUTENTICACIÓN
// =====================================

export const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      const { access_token, user } = response.data;
      
      // Guardar token y datos de usuario
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async register(userData) {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      const { access_token, user } = response.data;
      
      // Guardar token y datos de usuario
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/api/auth/me');
      
      // Actualizar datos de usuario en localStorage
      localStorage.setItem('user_data', JSON.stringify(response.data));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async updateProfile(updateData) {
    try {
      const response = await apiClient.put('/api/auth/me', updateData);
      
      // Actualizar datos de usuario en localStorage
      localStorage.setItem('user_data', JSON.stringify(response.data));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    toast.success('Sesión cerrada correctamente');
    return { success: true };
  },

  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    return token && token !== 'fake-jwt-token-for-development';
  },

  getCurrentUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

// =====================================
// SERVICIOS DE WORKOUT (ACTUALIZADOS)
// =====================================

export const workoutService = {
  async saveWorkoutSession(sessionData) {
    try {
      const response = await apiClient.post('/api/workouts/sessions', sessionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error guardando sesión:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getUserSessions(limit = 10, offset = 0) {
    try {
      const response = await apiClient.get('/api/workouts/sessions', {
        params: { limit, offset }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getSessionDetail(sessionId) {
    try {
      const response = await apiClient.get(`/api/workouts/sessions/${sessionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo detalle de sesión:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getWorkoutStats(days = 30) {
    try {
      const response = await apiClient.get('/api/workouts/stats/summary', {
        params: { days }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  },

  async getAdvancedStats(days = 30) {
    try {
      const response = await apiClient.get('/api/workouts/stats/advanced', {
        params: { days }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo estadísticas avanzadas:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }
};

// =====================================
// SERVICIOS BÁSICOS EXISTENTES
// =====================================

export const apiService = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testConnection() {
    try {
      const response = await apiClient.get('/api/test');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testDatabase() {
    try {
      const response = await apiClient.get('/api/db-test');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getExerciseTypes() {
    try {
      const response = await apiClient.get('/api/exercises/types');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo tipos de ejercicios:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }
};

// =====================================
// FUNCIONES DE UTILIDAD
// =====================================

export const checkBackendStatus = async () => {
  try {
    const result = await apiService.checkHealth();
    if (result.success) {
      console.log('✅ Backend disponible:', result.data);
      return true;
    } else {
      console.log('❌ Backend no disponible:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando backend:', error);
    return false;
  }
};

export const getSystemInfo = async () => {
  try {
    const [health, test, dbTest] = await Promise.all([
      apiService.checkHealth(),
      apiService.testConnection(),
      apiService.testDatabase()
    ]);

    return {
      health: health.success ? health.data : null,
      connection: test.success ? test.data : null,
      database: dbTest.success ? dbTest.data : null,
      allConnected: health.success && test.success && dbTest.success,
      features: {
        poseAnalysis: test.success && test.data?.data?.ai_ready,
        workoutTracking: dbTest.success && dbTest.data?.tables_ready?.workout_sessions,
        realTimeFeedback: test.success && test.data?.data?.pose_detection,
        authentication: true // Nueva característica
      }
    };
  } catch (error) {
    console.error('❌ Error obteniendo info del sistema:', error);
    return {
      health: null,
      connection: null,
      database: null,
      allConnected: false,
      features: {
        poseAnalysis: false,
        workoutTracking: false,
        realTimeFeedback: false,
        authentication: false
      }
    };
  }
};

// =====================================
// TRANSFORMADORES DE DATOS
// =====================================

export const transformSessionDataForBackend = (frontendSessionData) => {
  return {
    exercise_type: frontendSessionData.exerciseType,
    duration_seconds: frontendSessionData.duration,
    technique_score: frontendSessionData.finalScore || frontendSessionData.averageScore || 0,
    accuracy_percentage: frontendSessionData.accuracy || 0,
    total_frames: frontendSessionData.totalFrames || 0,
    good_frames: frontendSessionData.goodFrames || 0,
    avg_angles: frontendSessionData.angles && frontendSessionData.angles.length > 0 
      ? calculateAverageAngles(frontendSessionData.angles)
      : frontendSessionData.lastAngles || {},
    session_notes: `Análisis automático con IA - ${frontendSessionData.exerciseType}`,
    pose_data: JSON.stringify({
      angles: frontendSessionData.angles?.slice(-10) || [], // Últimos 10 frames
      feedback: frontendSessionData.feedback || [],
      confidence: frontendSessionData.confidence || 0,
      detected: frontendSessionData.detected || false
    }),
    angle_history: frontendSessionData.angles || [],
    feedback: frontendSessionData.feedback || []
  };
};

export const calculateAverageAngles = (anglesArray) => {
  if (!anglesArray || anglesArray.length === 0) return {};
  
  const avgAngles = {};
  const joints = Object.keys(anglesArray[0] || {});
  
  joints.forEach(joint => {
    const values = anglesArray
      .map(frame => frame[joint])
      .filter(val => val !== null && val !== undefined && !isNaN(val));
    
    if (values.length > 0) {
      avgAngles[joint] = Math.round(
        values.reduce((sum, val) => sum + val, 0) / values.length
      );
    }
  });
  
  return avgAngles;
};

// =====================================
// VALIDADORES
// =====================================

export const validateSessionData = (sessionData) => {
  const errors = [];

  if (!sessionData.exercise_type) {
    errors.push('Tipo de ejercicio es requerido');
  }

  if (!sessionData.duration_seconds || sessionData.duration_seconds <= 0) {
    errors.push('Duración debe ser mayor a 0');
  }

  if (sessionData.technique_score < 0 || sessionData.technique_score > 100) {
    errors.push('Puntuación de técnica debe estar entre 0 y 100');
  }

  if (sessionData.accuracy_percentage < 0 || sessionData.accuracy_percentage > 100) {
    errors.push('Porcentaje de precisión debe estar entre 0 y 100');
  }

  if (sessionData.total_frames < 0) {
    errors.push('Total de frames no puede ser negativo');
  }

  if (sessionData.good_frames < 0 || sessionData.good_frames > sessionData.total_frames) {
    errors.push('Frames buenos no puede ser mayor al total');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserRegistration = (userData) => {
  const errors = [];

  if (!userData.username || userData.username.length < 3) {
    errors.push('Usuario debe tener al menos 3 caracteres');
  }

  if (!userData.email || !/\S+@\S+\.\S+/.test(userData.email)) {
    errors.push('Email debe tener formato válido');
  }

  if (!userData.password || userData.password.length < 6) {
    errors.push('Contraseña debe tener al menos 6 caracteres');
  }

  if (userData.height && (userData.height < 100 || userData.height > 250)) {
    errors.push('Altura debe estar entre 100 y 250 cm');
  }

  if (userData.weight && (userData.weight < 30 || userData.weight > 300)) {
    errors.push('Peso debe estar entre 30 y 300 kg');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// =====================================
// HOOKS PERSONALIZADOS
// =====================================

export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUserData());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido ${result.data.user.first_name || result.data.user.username}!`);
    }
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      toast.success('¡Cuenta creada exitosamente!');
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updateData) => {
    const result = await authService.updateProfile(updateData);
    if (result.success) {
      setUser(result.data);
      toast.success('Perfil actualizado correctamente');
    }
    return result;
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  };
};

export const useWorkoutSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await workoutService.getUserSessions(limit, offset);
      if (result.success) {
        setSessions(result.data);
      } else {
        setError(result.error);
        toast.error('Error cargando sesiones');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error inesperado cargando sesiones');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (sessionData) => {
    try {
      // Transformar datos para el backend
      const transformedData = transformSessionDataForBackend(sessionData);
      
      // Validar datos
      const validation = validateSessionData(transformedData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const result = await workoutService.saveWorkoutSession(transformedData);
      if (result.success) {
        toast.success('Sesión guardada correctamente con análisis IA');
        // Recargar sesiones
        loadSessions();
        return result.data;
      } else {
        toast.error('Error guardando sesión');
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(`Error guardando sesión: ${error.message}`);
      throw error;
    }
  };

  return {
    sessions,
    loading,
    error,
    loadSessions,
    saveSession
  };
};

export const useWorkoutStats = (days = 30) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await workoutService.getAdvancedStats(days);
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [days]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
};

// Exportar servicios principales
export default {
  auth: authService,
  workout: workoutService,
  api: apiService
};