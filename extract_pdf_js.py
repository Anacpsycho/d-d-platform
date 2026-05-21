import pikepdf
import sys
import os

def extract_javascript_from_pdf(pdf_path):
    """Extract all JavaScript code from a PDF file"""
    try:
        pdf = pikepdf.open(pdf_path)
        
        # Get JavaScript names array
        if not hasattr(pdf.Root, 'Names') or not hasattr(pdf.Root.Names, 'JavaScript'):
            print("No JavaScript found in PDF")
            return {}
        
        names = pdf.Root.Names.JavaScript.Names
        js_scripts = {}
        
        # Names array is structured as [name1, dict1, name2, dict2, ...]
        for i in range(0, len(names), 2):
            script_name = str(names[i])
            script_obj = names[i + 1]
            
            if hasattr(script_obj, 'JS'):
                try:
                    # Try to read the JavaScript stream
                    js_stream = script_obj.JS
                    if hasattr(js_stream, 'read_bytes'):
                        js_code = js_stream.read_bytes().decode('utf-8', errors='ignore')
                    else:
                        js_code = str(js_stream)
                    
                    js_scripts[script_name] = js_code
                    print(f"[OK] Extracted: {script_name} ({len(js_code)} chars)")
                except Exception as e:
                    print(f"[ERROR] Error extracting {script_name}: {e}")
        
        return js_scripts
    
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return {}

if __name__ == "__main__":
    pdf_path = "Seraphine (2).pdf"
    
    print(f"Extracting JavaScript from: {pdf_path}\n")
    js_scripts = extract_javascript_from_pdf(pdf_path)
    
    print(f"\n{'='*60}")
    print(f"Total scripts extracted: {len(js_scripts)}")
    print(f"{'='*60}\n")
    
    # Save each script to a separate file
    for name, code in js_scripts.items():
        filename = f"js_extracted/{name.replace('/', '_')}.js"
        print(f"Saving: {filename}")
    
    # Create output directory
    os.makedirs('js_extracted', exist_ok=True)
    
    # Save all scripts
    for name, code in js_scripts.items():
        safe_name = name.replace('/', '_').replace('\\', '_')
        filename = f"js_extracted/{safe_name}.js"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(code)
    
    # Create index file
    with open('js_extracted/INDEX.txt', 'w', encoding='utf-8') as f:
        f.write("JavaScript Scripts Extracted from PDF\n")
        f.write("="*60 + "\n\n")
        for name, code in js_scripts.items():
            f.write(f"{name}: {len(code)} characters\n")
    
    print(f"\n[SUCCESS] All scripts saved to js_extracted/ directory")

# Made with Bob
