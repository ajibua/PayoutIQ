echo 1. Launching FastAPI Backend on Port 8000...
start "PayoutIQ Backend API Server" cmd /c "cd backend && .venv\Scripts\python -m uvicorn main:app --reload --port 8000"

echo 2. Launching React Vite Frontend on Port 5173...
start "PayoutIQ Frontend Development Server" cmd /c "cd frontend && npm run dev"

echo.
echo Both services starting in separate command prompts.
echo - Web App Portal: http://localhost:5173 (or http://localhost:5174)
echo - Swagger API Documentation: http://localhost:8000/docs
echo.
echo Close the opened prompt windows to stop the servers.
pause
