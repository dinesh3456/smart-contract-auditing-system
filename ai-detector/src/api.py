import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from AnomalyDetector import AnomalyDetectorAPI

# Load model path from environment variable or use default
MODEL_PATH = os.environ.get("MODEL_PATH", "models/anomaly_model.pkl")

# Initialize FastAPI app
app = FastAPI(
    title="Smart Contract Anomaly Detector",
    description="AI-based anomaly detection for smart contracts",
    version="1.0.0"
)

# Initialize the anomaly detector API
detector_api = AnomalyDetectorAPI(MODEL_PATH)

# Define request/response models
class ContractRequest(BaseModel):
    sourceCode: str
    bytecode: Optional[str] = None
    abi: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str = "1.0.0"

class TrainingRequest(BaseModel):
    contracts: List[Dict[str, str]]

# Define endpoints
@app.get("/health", response_model=HealthResponse)
def health_check():
    """Check if the service is healthy and the model is loaded"""
    return {
        "status": "healthy",
        "model_loaded": hasattr(detector_api.detector, "model"),
        "version": "1.0.0"
    }

@app.post("/api/analyze")
def analyze_contract(contract: ContractRequest):
    """
    Analyze a smart contract for anomalies
    
    - **sourceCode**: Solidity source code
    - **bytecode**: (Optional) Compiled bytecode
    - **abi**: (Optional) Contract ABI
    """
    try:
        result = detector_api.analyze_contract(
            contract.sourceCode, 
            contract.bytecode, 
            contract.abi
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/train")
def train_model(request: TrainingRequest):
    """
    Train the anomaly detection model with new contracts
    
    - **contracts**: List of contract data dictionaries with 'code' field
    """
    try:
        success = detector_api.train_model(request.contracts, MODEL_PATH)
        if success:
            return {"status": "success", "message": "Model trained successfully"}
        else:
            raise HTTPException(status_code=500, detail="Model training failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

# Create a pre-training utility function
def ensure_model_exists():
    """Ensure a model exists, creating one if necessary"""
    if not os.path.exists("models"):
        os.makedirs("models")
        
    if not os.path.exists(MODEL_PATH):
        print(f"No model found at {MODEL_PATH}, initializing with default parameters")
        # Create a simple model with sample data
        sample_contract = """
        pragma solidity ^0.8.0;
        
        contract SimpleStorage {
            uint private data;
            
            function set(uint x) public {
                data = x;
            }
            
            function get() public view returns (uint) {
                return data;
            }
        }
        """
        # Initialize with a single contract
        detector_api.detector.train([{"code": sample_contract}])
        detector_api.detector.save_model(MODEL_PATH)
        print(f"Created default model at {MODEL_PATH}")

# Run the server when this script is executed directly
if __name__ == "__main__":
    # Initialize model if needed
    ensure_model_exists()
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 5002))  # Match the port expected by backend
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting AI Detector API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)