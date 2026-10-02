"""Independent numerical oracle from the unmodified MATLAB Live Scripts.

Only arithmetic in the course's DHL calls is interpreted, never MATLAB code.
The matrix is factored as Rz * translation * Rx, as in the original function.
Run with python3 scripts/course_reference.py to regenerate the test fixtures.
"""
import ast
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def code_from_mlx(path):
    with zipfile.ZipFile(path) as archive:
        doc = ET.fromstring(archive.read('matlab/document.xml'))
    blocks = []
    for paragraph in doc.findall('.//w:p', NS):
        style = paragraph.find('w:pPr/w:pStyle', NS)
        if style is not None and style.get('{' + NS['w'] + '}val') == 'code':
            blocks.append(''.join(t.text or '' for t in paragraph.findall('.//w:t', NS)))
    return '\n\n'.join(blocks)


def arithmetic(expression, values):
    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return node.value
        if isinstance(node, ast.Name):
            return values[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -visit(node.operand)
        if isinstance(node, ast.BinOp):
            a, b = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Add): return a + b
            if isinstance(node.op, ast.Sub): return a - b
            if isinstance(node.op, ast.Div): return a / b
        raise ValueError(f'Unsupported course expression: {expression}')
    return visit(ast.parse(expression.strip(), mode='eval').body)


def product(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def original_dhl(theta, d, a, alpha):
    c, s = math.cos(theta), math.sin(theta)
    ca, sa = math.cos(math.radians(alpha)), math.sin(math.radians(alpha))
    rz = [[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1]]
    translation = [[1,0,0,a],[0,1,0,0],[0,0,1,d],[0,0,0,1]]
    rx = [[1,0,0,0],[0,ca,-sa,0],[0,sa,ca,0],[0,0,0,1]]
    return product(product(rz, translation), rx)


def main():
    definitions = [
        ('scara', 'semana2/T3_401S_DH.mlx', ['theta1','theta2','d3','theta4'],
         [[0,0,0,0],[30,55,-70,20],[90,-90,-150,180],[-180,150,0,-180],[180,-150,-150,180],[45,0,-30,70],[0,180,-70,0]]),
        ('vt6', 'semana2/DHL_VTL_901S.mlx', [f'theta{i}' for i in range(1,7)],
         [[0,0,0,0,0,0],[0,-25,20,0,35,0],[30,-40,70,-80,50,120],[-180,-100,-120,-180,-120,-180],[180,100,120,180,120,180],[90,0,90,30,0,-60],[22.5,60,180/7,18,20,30]]),
        ('agilus', 'semana2/Agilus_C4.mlx', [f'theta{i}' for i in range(1,7)],
         [[0,0,0,0,0,0],[20,25,-20,0,40,10],[30,-40,70,-80,50,120],[-180,-110,-120,-180,-120,-180],[180,110,120,180,120,180],[90,0,90,30,0,-60],[22.5,60,180/7,18,20,30]])
    ]
    cases = []
    for robot, relative, names, poses in definitions:
        path = ROOT / relative
        code = code_from_mlx(path)
        constants = {name: float(value) for name, value in re.findall(r'^\s*(L\d+)\s*=\s*([\d.]+)\s*;', code, re.M)}
        calls = re.findall(r'^\s*M\d\d\s*=\s*DHL\(([^\n]+)\);', code, re.M)
        assert len(calls) == len(names)
        for q in poses:
            values = {**constants, 'pi': math.pi, **{name: v if name == 'd3' else math.radians(v) for name, v in zip(names, q)}}
            rows = [[arithmetic(part, values) for part in call.split(',')] for call in calls]
            transform = [[int(i == j) for j in range(4)] for i in range(4)]
            for row in rows:
                transform = product(transform, original_dhl(*row))
            cases.append({'robot': robot, 'source': relative, 'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'q': q, 'end': transform})
    out = ROOT / 'tests/fixtures/course-reference.json'
    out.write_text(json.dumps(cases, indent=2) + '\n')
    print(f'{len(cases)} poses generated directly from original .mlx files (Python, not MATLAB).')


if __name__ == '__main__':
    main()
