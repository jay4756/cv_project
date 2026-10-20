# Smart Outfit Color Coordinator

A small computer vision project that analyzes a user-uploaded outfit image and suggests a matching palette for clothing coordination.

## Features

- Upload outfit images
- Detect dominant outfit colors using OpenCV and quantization
- Suggest a complementary accent color
- Recommend outfit styling combinations
- Show a quick visual palette in a web interface

## Tech Stack

- Python and FastAPI
- OpenCV
- NumPy
- Pillow
- React and Vite
- Docker Compose

## Project Structure

- `backend.py` – FastAPI entry point
- `frontend/` – React user interface
- `src/outfit_color_coordinator.py` – color extraction and recommendation logic
- `requirements.txt` – project dependencies

## Run with Docker Compose

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The frontend is served by Nginx and sends API requests to the backend through `/api`.

To stop the services:

```bash
docker compose down
```

## Run locally without Docker

Start the backend from the project root:

```bash
python -m pip install -r requirements.txt
python -m uvicorn backend:app --host 0.0.0.0 --port 8000
```

In another terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL shown in the terminal. Vite proxies `/api` requests to the local backend.

## Example use case

You can upload a photo of a shirt, dress, or full outfit and the app identifies the main colors and suggests color pairings that work together.

## Future improvements

- Add garment segmentation with a better foreground mask
- Integrate a fashion recommendation model
- Add shopping suggestions / matching accessories
- Support outfit combinations for different seasons or occasions
