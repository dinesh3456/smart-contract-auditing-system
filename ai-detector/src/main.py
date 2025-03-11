import os
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import json

class ContractFeatureExtractor:
    """Extract features from smart contract for anomaly detection"""
    
    def __init__(self):
        self.features = []
    
    def extract_features(self, contract_code, bytecode=None, abi=None):
        """
        Extract numerical features from a smart contract
        
        Parameters:
        contract_code (str): Solidity source code
        bytecode (str, optional): Compiled bytecode
        abi (dict, optional): Contract ABI
        
        Returns:
        dict: Extracted features
        """
        # Placeholder - in a real implementation, this would extract
        # meaningful features from the contract
        
        # Simple features as example
        lines_of_code = len(contract_code.split('\n'))
        function_count = contract_code.count('function')
        event_count = contract_code.count('event')
        modifier_count = contract_code.count('modifier')
        external_calls = contract_code.count('.call(') + contract_code.count('.send(') + contract_code.count('.transfer(')
        using_safe_math = 'SafeMath' in contract_code
        
        features = {
            'lines_of_code': lines_of_code,
            'function_count': function_count,
            'event_count': event_count,
            'modifier_count': modifier_count,
            'external_calls': external_calls,
            'using_safe_math': 1 if using_safe_math else 0,
            # Additional features would be added in a real implementation
        }
        
        return features

class AnomalyDetector:
    """Detect anomalies in smart contracts using machine learning"""
    
    def __init__(self, model_path=None):
        """
        Initialize the anomaly detector
        
        Parameters:
        model_path (str, optional): Path to a saved model
        """
        self.scaler = StandardScaler()
        if model_path and os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            # Default model with basic parameters
            self.model = IsolationForest(
                n_estimators=100,
                max_samples='auto',
                contamination=0.1,
                random_state=42
            )
            
        self.feature_extractor = ContractFeatureExtractor()
    
    def train(self, contracts_data):
        """
        Train the anomaly detection model
        
        Parameters:
        contracts_data (list): List of contract data dictionaries
        
        Returns:
        self: Trained model
        """
        # Extract features from each contract
        features_list = []
        for contract in contracts_data:
            features = self.feature_extractor.extract_features(
                contract['code'],
                contract.get('bytecode'),
                contract.get('abi')
            )
            features_list.append(features)
        
        # Convert to DataFrame
        df = pd.DataFrame(features_list)
        
        # Scale features
        X = self.scaler.fit_transform(df)
        
        # Train model
        self.model.fit(X)
        
        return self
    
    def predict(self, contract_code, bytecode=None, abi=None):
        """
        Predict if a contract is anomalous
        
        Parameters:
        contract_code (str): Solidity source code
        bytecode (str, optional): Compiled bytecode
        abi (dict, optional): Contract ABI
        
        Returns:
        dict: Prediction results
        """
        # Extract features
        features = self.feature_extractor.extract_features(contract_code, bytecode, abi)
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Scale features
        X = self.scaler.transform(df)
        
        # Predict
        score = self.model.score_samples(X)[0]
        prediction = self.model.predict(X)[0]
        
        return {
            'is_anomaly': prediction == -1,
            'anomaly_score': float(score),
            'features': features
        }
    
    def save_model(self, model_path):
        """
        Save the model to disk
        
        Parameters:
        model_path (str): Path to save the model
        """
        joblib.dump(self.model, model_path)
        scaler_path = model_path.replace('.pkl', '_scaler.pkl')
        joblib.dump(self.scaler, scaler_path)


# Example usage:
if __name__ == "__main__":
    # Sample contract code for testing
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
    
    # Initialize detector
    detector = AnomalyDetector()
    
    # Since we don't have training data, we'll skip training
    # In a real scenario, you would train with:
    # detector.train(training_data)
    
    # Just use the untrained model for demonstration
    result = detector.predict(sample_contract)
    
    print(json.dumps(result, indent=2))