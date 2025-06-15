"""
GymForm Analyzer - Workout Routes (Corregido)
Endpoints para manejar sesiones de entrenamiento y análisis
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, date
import json
import mysql.connector
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

# =====================================
# FUNCIÓN DE CONEXIÓN A BD (LOCAL)
# =====================================

def get_mysql_connection():
    """Obtener conexión directa a MySQL"""
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
        
        connection = mysql.connector.connect(**config)
        return connection
    except mysql.connector.Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

# =====================================
# MODELOS PYDANTIC
# =====================================

class WorkoutSessionCreate(BaseModel):
    exercise_type: str = Field(..., description="Tipo de ejercicio")
    duration_seconds: int = Field(..., gt=0, description="Duración en segundos")
    technique_score: float = Field(..., ge=0, le=100, description="Puntuación de técnica")
    accuracy_percentage: float = Field(..., ge=0, le=100, description="Porcentaje de precisión")
    total_frames: int = Field(..., ge=0, description="Total de frames procesados")
    good_frames: int = Field(..., ge=0, description="Frames con buena técnica")
    avg_angles: Dict[str, float] = Field(default_factory=dict, description="Ángulos promedio")
    session_notes: Optional[str] = Field(None, description="Notas de la sesión")
    pose_data: Optional[str] = Field(None, description="Datos de pose en JSON")

class WorkoutSessionResponse(BaseModel):
    id: int
    exercise_type: str
    duration_seconds: int
    technique_score: float
    accuracy_percentage: float
    total_frames: int
    good_frames: int
    avg_angles: Dict[str, Any]
    session_notes: Optional[str]
    created_at: datetime

# =====================================
# DEPENDENCIAS
# =====================================

def get_current_user_id():
    """
    TODO: Implementar autenticación real
    Por ahora retorna ID del usuario de prueba
    """
    return 1

# =====================================
# ENDPOINTS DE SESIONES
# =====================================

@router.post("/sessions", response_model=Dict[str, Any])
async def create_workout_session(
    session_data: WorkoutSessionCreate,
    user_id: int = Depends(get_current_user_id)
):
    """Crear nueva sesión de entrenamiento"""
    
    connection = None
    try:
        connection = get_mysql_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo conectar a la base de datos"
            )
            
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
            user_id,
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
        
        # 3. Crear registro de performance
        performance_query = """
        INSERT INTO exercise_performances (
            session_id, exercise_type_id, user_id, set_number,
            repetitions, technique_score, avg_knee_angle, avg_hip_angle,
            avg_shoulder_angle, avg_elbow_angle, movement_speed,
            stability_score, symmetry_score, pose_data,
            angle_history, feedback
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # Preparar datos de ángulos
        angles = session_data.avg_angles
        
        cursor.execute(performance_query, (
            session_id,
            exercise_type_id,
            user_id,
            1,  # set_number
            session_data.total_frames,  # usando frames como repeticiones
            session_data.technique_score,
            angles.get('leftKnee'),
            angles.get('leftHip'),
            angles.get('leftShoulder'),
            angles.get('leftElbow'),
            None,  # movement_speed
            session_data.accuracy_percentage,  # usando como stability_score
            100.0,  # symmetry_score default
            session_data.pose_data,
            json.dumps({"total_frames": session_data.total_frames, "good_frames": session_data.good_frames}),
            json.dumps([f"Precisión: {session_data.accuracy_percentage}%"])
        ))
        
        connection.commit()
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "Sesión guardada correctamente",
            "data": {
                "id": session_id,
                "exercise_type": session_data.exercise_type,
                "duration_seconds": session_data.duration_seconds,
                "technique_score": session_data.technique_score,
                "accuracy_percentage": session_data.accuracy_percentage
            }
        }
        
    except mysql.connector.Error as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    except Exception as e:
        if connection:
            connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )
    finally:
        if connection:
            cursor.close()
            connection.close()

@router.get("/sessions", response_model=List[WorkoutSessionResponse])
async def get_user_sessions(
    limit: int = 10,
    offset: int = 0,
    user_id: int = Depends(get_current_user_id)
):
    """Obtener sesiones del usuario"""
    
    connection = None
    try:
        connection = get_mysql_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo conectar a la base de datos"
            )
            
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
            COUNT(ep.id) as total_exercises,
            AVG(ep.technique_score) as avg_technique_score
        FROM workout_sessions ws
        LEFT JOIN exercise_performances ep ON ws.id = ep.session_id
        WHERE ws.user_id = %s
        GROUP BY ws.id
        ORDER BY ws.created_at DESC
        LIMIT %s OFFSET %s
        """
        
        cursor.execute(query, (user_id, limit, offset))
        sessions = cursor.fetchall()
        
        # Procesar resultados
        result = []
        for session in sessions:
            # Extraer tipo de ejercicio del nombre de la sesión
            exercise_type = session['session_name'].replace('Sesión ', '').lower()
            
            result.append({
                "id": session['id'],
                "exercise_type": exercise_type,
                "duration_seconds": int(session['duration_minutes'] * 60),
                "technique_score": session['average_score'],
                "accuracy_percentage": session['avg_technique_score'] or 0,
                "total_frames": session['total_exercises'] or 0,
                "good_frames": int((session['total_exercises'] or 0) * 0.8),  # Estimación
                "avg_angles": {},  # Se podría calcular de exercise_performances
                "session_notes": session['notes'],
                "created_at": session['created_at']
            })
        
        return result
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        if connection:
            cursor.close()
            connection.close()

@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Obtener detalles de una sesión específica"""
    
    connection = None
    try:
        connection = get_mysql_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo conectar a la base de datos"
            )
            
        cursor = connection.cursor(dictionary=True)
        
        # Obtener sesión
        session_query = """
        SELECT * FROM workout_sessions 
        WHERE id = %s AND user_id = %s
        """
        cursor.execute(session_query, (session_id, user_id))
        session = cursor.fetchone()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesión no encontrada"
            )
        
        # Obtener performances de la sesión
        performance_query = """
        SELECT 
            ep.*,
            et.name as exercise_name
        FROM exercise_performances ep
        JOIN exercise_types et ON ep.exercise_type_id = et.id
        WHERE ep.session_id = %s
        ORDER BY ep.created_at
        """
        cursor.execute(performance_query, (session_id,))
        performances = cursor.fetchall()
        
        return {
            "session": session,
            "performances": performances,
            "summary": {
                "total_exercises": len(performances),
                "average_score": session['average_score'],
                "duration_minutes": session['duration_minutes']
            }
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        if connection:
            cursor.close()
            connection.close()

@router.get("/stats/summary")
async def get_workout_stats(
    days: int = 30,
    user_id: int = Depends(get_current_user_id)
):
    """Obtener estadísticas de entrenamientos"""
    
    connection = None
    try:
        connection = get_mysql_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo conectar a la base de datos"
            )
            
        cursor = connection.cursor(dictionary=True)
        
        # Estadísticas de sesiones
        stats_query = """
        SELECT 
            COUNT(*) as total_sessions,
            AVG(average_score) as avg_score,
            SUM(duration_minutes) as total_minutes,
            MAX(average_score) as best_score,
            DATE(created_at) as workout_date
        FROM workout_sessions 
        WHERE user_id = %s 
        AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY DATE(created_at)
        ORDER BY workout_date DESC
        """
        
        cursor.execute(stats_query, (user_id, days))
        daily_stats = cursor.fetchall()
        
        # Estadísticas por ejercicio
        exercise_stats_query = """
        SELECT 
            et.name as exercise_name,
            COUNT(ep.id) as total_performances,
            AVG(ep.technique_score) as avg_technique_score,
            MAX(ep.technique_score) as best_score
        FROM exercise_performances ep
        JOIN exercise_types et ON ep.exercise_type_id = et.id
        JOIN workout_sessions ws ON ep.session_id = ws.id
        WHERE ws.user_id = %s 
        AND ws.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY et.id, et.name
        ORDER BY total_performances DESC
        """
        
        cursor.execute(exercise_stats_query, (user_id, days))
        exercise_stats = cursor.fetchall()
        
        # Resumen general
        total_sessions = sum(day['total_sessions'] for day in daily_stats)
        avg_score = sum(day['avg_score'] * day['total_sessions'] for day in daily_stats) / total_sessions if total_sessions > 0 else 0
        total_minutes = sum(day['total_minutes'] for day in daily_stats)
        
        return {
            "summary": {
                "total_sessions": total_sessions,
                "avg_score": round(avg_score, 2),
                "total_minutes": total_minutes,
                "period_days": days
            },
            "daily_stats": daily_stats,
            "exercise_stats": exercise_stats
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}"
        )
    finally:
        if connection:
            cursor.close()
            connection.close()

# =====================================
# UTILIDADES
# =====================================

async def get_or_create_exercise_type(cursor, exercise_name: str) -> int:
    """Obtener o crear tipo de ejercicio"""
    
    # Buscar ejercicio existente
    cursor.execute("SELECT id FROM exercise_types WHERE name = %s", (exercise_name,))
    result = cursor.fetchone()
    
    if result:
        return result['id']
    
    # Crear nuevo ejercicio
    insert_query = """
    INSERT INTO exercise_types (name, description, category, difficulty_level)
    VALUES (%s, %s, %s, %s)
    """
    
    cursor.execute(insert_query, (
        exercise_name,
        f"Ejercicio {exercise_name} - análisis automático",
        "strength",
        "beginner"
    ))
    
    return cursor.lastrowid