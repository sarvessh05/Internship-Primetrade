# Script to generate static openapi.json from FastAPI app
import json
import os
import sys

# Setup dummy environment variables in case .env is missing (e.g. in CI or Docker build stage)
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@host/db")
os.environ.setdefault("JWT_SECRET", "dummy_secret_for_generation_purposes_only")
os.environ.setdefault("JWT_EXPIRE_DAYS", "7")
os.environ.setdefault("ADMIN_SECRET", "warehouse-admin-2024")

# Ensure backend directory is in the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.openapi.utils import get_openapi
from app.main import app

def generate_openapi():
    # Force generate openapi schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    # Target directory is the workspace root
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_path = os.path.join(root_dir, "openapi.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"OpenAPI spec successfully written to {output_path}")

if __name__ == "__main__":
    generate_openapi()
