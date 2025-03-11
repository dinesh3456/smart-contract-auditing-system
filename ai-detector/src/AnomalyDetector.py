import os
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import re
from collections import Counter
import json

class ContractFeatureExtractor:
    """Extract features from smart contract for anomaly detection"""
    
    def __init__(self):
        self.features = []
        # Common features to extract from smart contracts
        self.opcodes_to_track = [
            'CALL', 'DELEGATECALL', 'STATICCALL', 'SELFDESTRUCT', 'SSTORE', 'SLOAD',
            'CREATE', 'CREATE2', 'EXTCODESIZE', 'EXTCODECOPY', 'BALANCE'
        ]
        
        # Patterns to search for in source code
        self.patterns = {
            'external_calls': r'\.call\{|\.\s*call\s*\(|\.delegatecall|\.staticcall',
            'send_transfer': r'\.send\s*\(|\.transfer\s*\(',
            'selfdestruct': r'selfdestruct\s*\(|suicide\s*\(',
            'assembly': r'assembly\s*\{',
            'unchecked_math': r'unchecked\s*\{',
            'require_check': r'require\s*\(',
            'tx_origin': r'tx\.origin',
            'block_values': r'block\.timestamp|block\.number|block\.difficulty',
            'balance_check': r'balance|balanceOf',
            'ether_lock': r'receive\s*\(\s*\)|fallback\s*\(\s*\)',
            'reentrancy_guard': r'nonReentrant|ReentrancyGuard'
        }
    
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
        if not contract_code:
            return {}
        
        # Basic code metrics
        lines_of_code = len(contract_code.split('\n'))
        contract_size = len(contract_code)
        
        # Count functions, events, modifiers
        function_count = len(re.findall(r'function\s+\w+', contract_code))
        event_count = len(re.findall(r'event\s+\w+', contract_code))
        modifier_count = len(re.findall(r'modifier\s+\w+', contract_code))
        constructor_count = len(re.findall(r'constructor\s*\(', contract_code))
        
        # External calls
        external_calls = len(re.findall(self.patterns['external_calls'], contract_code))
        send_transfer_calls = len(re.findall(self.patterns['send_transfer'], contract_code))
        
        # Risky patterns
        selfdestruct_calls = len(re.findall(self.patterns['selfdestruct'], contract_code))
        assembly_blocks = len(re.findall(self.patterns['assembly'], contract_code))
        unchecked_blocks = len(re.findall(self.patterns['unchecked_math'], contract_code))
        require_statements = len(re.findall(self.patterns['require_check'], contract_code))
        tx_origin_uses = len(re.findall(self.patterns['tx_origin'], contract_code))
        block_value_uses = len(re.findall(self.patterns['block_values'], contract_code))
        
        # Protection mechanisms
        balance_checks = len(re.findall(self.patterns['balance_check'], contract_code))
        ether_receive = len(re.findall(self.patterns['ether_lock'], contract_code))
        reentrancy_protection = len(re.findall(self.patterns['reentrancy_guard'], contract_code))
        
        # Complexity metrics
        avg_function_length = self._calculate_avg_function_length(contract_code)
        cyclomatic_complexity = self._estimate_cyclomatic_complexity(contract_code)
        
        # Storage usage
        state_variables = len(re.findall(r'^\s*\w+\s+\w+\s*;', contract_code, re.MULTILINE))
        mappings = len(re.findall(r'mapping\s*\(', contract_code))
        arrays = len(re.findall(r'\[\]', contract_code))
        
        # Inheritance
        inheritance_count = len(re.findall(r'contract\s+\w+\s+is\s+', contract_code))
        import_count = len(re.findall(r'import\s+', contract_code))
        
        # SafeMath or similar libraries
        using_safe_math = 1 if 'SafeMath' in contract_code else 0
        
        # Extract bytecode features if available
        bytecode_features = {}
        if bytecode:
            bytecode_features = self._extract_bytecode_features(bytecode)
        
        # Combine all features
        features = {
            # Code size and structure
            'lines_of_code': lines_of_code,
            'contract_size': contract_size,
            'function_count': function_count,
            'event_count': event_count,
            'modifier_count': modifier_count,
            'constructor_count': constructor_count,
            'state_variables': state_variables,
            'mappings': mappings,
            'arrays': arrays,
            'inheritance_count': inheritance_count,
            'import_count': import_count,
            
            # External interaction
            'external_calls': external_calls,
            'send_transfer_calls': send_transfer_calls,
            
            # Risk patterns
            'selfdestruct_calls': selfdestruct_calls,
            'assembly_blocks': assembly_blocks,
            'unchecked_blocks': unchecked_blocks,
            'tx_origin_uses': tx_origin_uses,
            'block_value_uses': block_value_uses,
            
            # Safety features
            'require_statements': require_statements,
            'balance_checks': balance_checks,
            'ether_receive': ether_receive,
            'reentrancy_protection': reentrancy_protection,
            'using_safe_math': using_safe_math,
            
            # Complexity
            'avg_function_length': avg_function_length,
            'cyclomatic_complexity': cyclomatic_complexity,
            
            # Derived metrics
            'external_calls_per_function': external_calls / max(function_count, 1),
            'require_per_function': require_statements / max(function_count, 1),
            'complexity_per_function': cyclomatic_complexity / max(function_count, 1)
        }
        
        # Add bytecode features if available
        if bytecode_features:
            features.update(bytecode_features)
            
        return features
    
    def _calculate_avg_function_length(self, code):
        """Calculate average function length in lines"""
        # Simple approximation - in a real implementation this would parse the AST
        functions = re.findall(r'function\s+\w+[^{]*{([^}]*)}', code)
        if not functions:
            return 0
        return sum(len(f.split('\n')) for f in functions) / len(functions)
    
    def _estimate_cyclomatic_complexity(self, code):
        """Estimate cyclomatic complexity"""
        # Simple approximation - count control flow statements
        if_count = len(re.findall(r'\bif\s*\(', code))
        for_count = len(re.findall(r'\bfor\s*\(', code))
        while_count = len(re.findall(r'\bwhile\s*\(', code))
        do_count = len(re.findall(r'\bdo\s*{', code))
        
        # 1 is the base complexity for a function
        return 1 + if_count + for_count + while_count + do_count
    
    def _extract_bytecode_features(self, bytecode):
        """Extract features from bytecode if available"""
        # This is a placeholder for bytecode analysis
        # In a real implementation, we would parse the bytecode and extract opcode frequencies
        
        features = {}
        # Count opcode frequencies (simple approximation)
        for opcode in self.opcodes_to_track:
            count = bytecode.upper().count(opcode)
            features[f'opcode_{opcode.lower()}'] = count
            
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
                contamination=0.1,  # Assuming 10% of contracts might be anomalous
                random_state=42
            )
            
        self.feature_extractor = ContractFeatureExtractor()
        self.threshold_score = -0.5  # Anomaly threshold
    
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
        
        # Fill NA values with 0
        df = df.fillna(0)
        
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
        
        # Fill NA values with 0
        df = df.fillna(0)
        
        # Scale features
        try:
            X = self.scaler.transform(df)
        except:
            # If scaling fails (e.g. new feature detected), use the original features
            # This is a simplification - in a real implementation we'd handle this better
            X = df.values
        
        # Predict
        score = self.model.score_samples(X)[0]
        prediction = self.model.predict(X)[0]
        
        # Analyze the main factors contributing to the anomaly
        anomaly_factors = []
        if prediction == -1:  # If anomalous
            anomaly_factors = self._analyze_anomaly_factors(features)
        
        return {
            'is_anomaly': prediction == -1,
            'anomaly_score': float(score),
            'features': features,
            'anomaly_factors': anomaly_factors,
            'threshold': self.threshold_score,
            'recommendation': self._generate_recommendation(prediction, features, anomaly_factors)
        }
    
    def _analyze_anomaly_factors(self, features):
        """Analyze what factors most contribute to the anomaly"""
        # This is a simplified analysis - in a real implementation, 
        # we would use feature importance from the model
        
        # Risk factors to check and their thresholds
        risk_factors = {
            'selfdestruct_calls': 0,  # Any selfdestruct is risky
            'external_calls': 5,  # Many external calls are risky
            'tx_origin_uses': 0,  # Any tx.origin use is risky
            'assembly_blocks': 3,  # Significant use of assembly is risky
            'reentrancy_protection': 0,  # Lack of reentrancy protection with external calls is risky
            'using_safe_math': 0  # Lack of SafeMath might be risky
        }
        
        anomaly_factors = []
        
        # Check for unusual code size
        if features['contract_size'] > 10000:
            anomaly_factors.append({
                'factor': 'large_contract_size',
                'description': 'Contract is unusually large which may indicate complexity issues',
                'value': features['contract_size']
            })
        
        # Check for risky patterns
        for factor, threshold in risk_factors.items():
            if factor in features:
                # For reentrancy protection, check if it's missing but there are external calls
                if factor == 'reentrancy_protection':
                    if features[factor] == 0 and features['external_calls'] > 0:
                        anomaly_factors.append({
                            'factor': 'missing_reentrancy_protection',
                            'description': 'Contract makes external calls but has no reentrancy protection',
                            'value': features['external_calls']
                        })
                # For SafeMath, check if it's missing but not using Solidity 0.8+
                elif factor == 'using_safe_math':
                    if features[factor] == 0:  # This is simplified - we'd need to check Solidity version
                        anomaly_factors.append({
                            'factor': 'missing_safe_math',
                            'description': 'Contract does not use SafeMath which may indicate vulnerability to overflow/underflow',
                            'value': 0
                        })
                # For other factors, check if they exceed threshold
                elif features[factor] > threshold:
                    factor_name = factor.replace('_', ' ')
                    anomaly_factors.append({
                        'factor': factor,
                        'description': f'Contract has unusual number of {factor_name} ({features[factor]})',
                        'value': features[factor]
                    })
        
        # Check complexity metrics
        if features['cyclomatic_complexity'] > 50:
            anomaly_factors.append({
                'factor': 'high_complexity',
                'description': 'Contract has high cyclomatic complexity which may indicate maintainability issues',
                'value': features['cyclomatic_complexity']
            })
        
        # Check for unusual ratios
        if features['external_calls_per_function'] > 2:
            anomaly_factors.append({
                'factor': 'high_external_calls_per_function',
                'description': 'Contract has unusually high ratio of external calls per function',
                'value': features['external_calls_per_function']
            })
        
        if features['require_per_function'] < 0.5 and features['function_count'] > 5:
            anomaly_factors.append({
                'factor': 'low_require_checks',
                'description': 'Contract has low number of require checks per function which may indicate missing validation',
                'value': features['require_per_function']
            })
        
        return anomaly_factors
    
    def _generate_recommendation(self, prediction, features, anomaly_factors):
        """Generate recommendations based on anomaly prediction"""
        if prediction != -1:  # Not anomalous
            return "No significant anomalies detected. The contract appears to follow common patterns."
        
        # Generate recommendations for anomalous contracts
        recommendations = ["The contract contains unusual patterns that may indicate potential issues:"]
        
        for factor in anomaly_factors:
            if factor['factor'] == 'selfdestruct_calls':
                recommendations.append("- Implement strict access controls for selfdestruct operations.")
            elif factor['factor'] == 'external_calls':
                recommendations.append("- Review and limit external calls. Consider implementing the checks-effects-interactions pattern.")
            elif factor['factor'] == 'tx_origin_uses':
                recommendations.append("- Replace tx.origin with msg.sender to prevent phishing attacks.")
            elif factor['factor'] == 'assembly_blocks':
                recommendations.append("- Review inline assembly code carefully for potential bugs or vulnerabilities.")
            elif factor['factor'] == 'missing_reentrancy_protection':
                recommendations.append("- Implement reentrancy guards (like OpenZeppelin's ReentrancyGuard) for functions making external calls.")
            elif factor['factor'] == 'missing_safe_math':
                recommendations.append("- Use SafeMath library or Solidity 0.8.0+ for automatic overflow/underflow protection.")
            elif factor['factor'] == 'high_complexity':
                recommendations.append("- Consider refactoring complex functions into smaller, more manageable pieces.")
            elif factor['factor'] == 'large_contract_size':
                recommendations.append("- Split large contracts into smaller, specialized contracts to improve readability and gas efficiency.")
            elif factor['factor'] == 'low_require_checks':
                recommendations.append("- Add thorough input validation with require statements for each function.")
            elif factor['factor'] == 'high_external_calls_per_function':
                recommendations.append("- Review and possibly reduce the number of external calls per function to limit exposure.")
        
        return "\n".join(recommendations)
    
    def save_model(self, model_path):
        """
        Save the model to disk
        
        Parameters:
        model_path (str): Path to save the model
        """
        joblib.dump(self.model, model_path)
        scaler_path = model_path.replace('.pkl', '_scaler.pkl')
        joblib.dump(self.scaler, scaler_path)


# API to interact with the anomaly detector
class AnomalyDetectorAPI:
    """API for detecting anomalies in smart contracts"""
    
    def __init__(self, model_path=None):
        """Initialize the API with a model"""
        self.detector = AnomalyDetector(model_path)
    
    def analyze_contract(self, contract_code, bytecode=None, abi=None):
        """
        Analyze a smart contract for anomalies
        
        Parameters:
        contract_code (str): Solidity source code
        bytecode (str, optional): Compiled bytecode
        abi (dict, optional): Contract ABI
        
        Returns:
        dict: Analysis results
        """
        result = self.detector.predict(contract_code, bytecode, abi)
        
        # Create a user-friendly summary
        anomaly_status = "🔴 Anomaly detected" if result['is_anomaly'] else "🟢 No anomalies detected"
        risk_level = self._determine_risk_level(result)
        
        # Format the result for the API response
        response = {
            'status': anomaly_status,
            'risk_level': risk_level,
            'anomaly_score': result['anomaly_score'],
            'analysis_summary': self._create_analysis_summary(result),
            'recommendation': result['recommendation'],
            'anomaly_factors': result['anomaly_factors'],
            'detailed_features': self._filter_important_features(result['features'])
        }
        
        return response
    
    def _determine_risk_level(self, result):
        """Determine risk level based on anomaly score and factors"""
        if not result['is_anomaly']:
            return "Low"
        
        # Count high-risk anomaly factors
        high_risk_count = sum(1 for factor in result['anomaly_factors'] 
                            if factor['factor'] in ['selfdestruct_calls', 'tx_origin_uses', 'missing_reentrancy_protection'])
        
        if high_risk_count > 0 or result['anomaly_score'] < -0.8:
            return "High"
        elif result['anomaly_score'] < -0.6:
            return "Medium"
        else:
            return "Low-Medium"
    
    def _create_analysis_summary(self, result):
        """Create a human-readable summary of the analysis"""
        if not result['is_anomaly']:
            return "This contract follows common patterns and doesn't exhibit unusual characteristics."
        
        # Create summary based on anomaly factors
        if not result['anomaly_factors']:
            return "This contract deviates from common patterns, but no specific risk factors were identified."
        
        # Group factors by category
        categories = {
            'security': ['selfdestruct_calls', 'tx_origin_uses', 'missing_reentrancy_protection', 'missing_safe_math'],
            'complexity': ['high_complexity', 'large_contract_size'],
            'structure': ['external_calls', 'high_external_calls_per_function', 'low_require_checks', 'assembly_blocks']
        }
        
        factor_categories = {category: [] for category in categories}
        
        for factor in result['anomaly_factors']:
            for category, factors in categories.items():
                if factor['factor'] in factors:
                    factor_categories[category].append(factor['description'])
                    break
        
        # Build summary from categories
        summary_parts = []
        for category, descriptions in factor_categories.items():
            if descriptions:
                summary_parts.append(f"{category.capitalize()} issues: {', '.join(descriptions)}")
        
        return " ".join(summary_parts)
    
    def _filter_important_features(self, features):
        """Filter out less important features for cleaner output"""
        important_keys = [
            'function_count', 'external_calls', 'selfdestruct_calls', 
            'tx_origin_uses', 'assembly_blocks', 'require_statements',
            'reentrancy_protection', 'using_safe_math', 'cyclomatic_complexity'
        ]
        return {k: v for k, v in features.items() if k in important_keys}
    
    def train_model(self, contracts_data, model_path='anomaly_model.pkl'):
        """
        Train the model with new data
        
        Parameters:
        contracts_data (list): List of contract data dictionaries
        model_path (str): Path to save the trained model
        
        Returns:
        bool: Training success
        """
        try:
            self.detector.train(contracts_data)
            self.detector.save_model(model_path)
            return True
        except Exception as e:
            print(f"Error training model: {e}")
            return False


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
    
    # Initialize API
    api = AnomalyDetectorAPI()
    
    # Analyze contract
    result = api.analyze_contract(sample_contract)
    
    # Print result
    print(json.dumps(result, indent=2))