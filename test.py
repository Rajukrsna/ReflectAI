import torch
import os
from transformers import pipeline
from accelerate import disk_offload

model_id = "meta-llama/Llama-3.2-3B"

try:
    # Load the model
    pipe = pipeline("text-generation", model=model_id, device_map="auto", torch_dtype=torch.bfloat16)
    print("Model loaded successfully.")
    
    # If using large models, you may want to offload to disk after loading
    disk_offload(pipe.model)
    print("Disk offloading applied.")
except Exception as e:
    print("Error loading the model:", e)
