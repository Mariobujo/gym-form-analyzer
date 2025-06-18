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