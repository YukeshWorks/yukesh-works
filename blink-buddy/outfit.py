"""Restyle a VRoid VRM: crop the top (shows the waist), remove the shorts, add a pleated skirt
skinned to the hips and upper legs. Pure Python + numpy; usage: python outfit.py in.vrm out.vrm"""
import json, struct, sys, copy
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
CROP_Y = float(sys.argv[3]) if len(sys.argv) > 3 else 1.07   # shirt faces below this height are removed
b = open(src, 'rb').read()
L = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + L])
bin_start = 20 + L + 8
BL = struct.unpack('<I', b[20 + L:24 + L])[0]
binbuf = bytearray(b[bin_start:bin_start + BL])

CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def acc(i):
    a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
    n = NC[a['type']]; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    arr = np.frombuffer(bytes(binbuf), dtype=CT[a['componentType']], count=a['count'] * n, offset=off)
    return arr.reshape(-1, n) if n > 1 else arr
def add(arr, ctype, typ, target=None, minmax=False):
    global binbuf
    while len(binbuf) % 4: binbuf.append(0)
    data = np.ascontiguousarray(arr).tobytes()
    bv = {'buffer': 0, 'byteOffset': len(binbuf), 'byteLength': len(data)}
    if target: bv['target'] = target
    binbuf += data
    j['bufferViews'].append(bv)
    a = {'bufferView': len(j['bufferViews']) - 1, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
    if minmax: a['min'] = arr.min(axis=0).tolist(); a['max'] = arr.max(axis=0).tolist()
    j['accessors'].append(a)
    return len(j['accessors']) - 1

mesh = j['meshes'][0]
mats = {i: j['materials'][p['material']]['name'] for i, p in enumerate(mesh['primitives'])}
tops = next(i for i, n in mats.items() if n.startswith('Tops'))
bots = next(i for i, n in mats.items() if n.startswith('Bottoms'))
body = next(i for i, n in mats.items() if 'SKIN' in n)

# 1) crop top: keep shirt triangles whose lowest vertex is above CROP_Y
p = mesh['primitives'][tops]; pos = acc(p['attributes']['POSITION']); tri = acc(p['indices']).reshape(-1, 3)
keep = pos[tri][:, :, 1].min(axis=1) >= CROP_Y
p['indices'] = add(tri[keep].astype(np.uint32).ravel(), 5125, 'SCALAR', 34963)
print('top: kept', int(keep.sum()), 'of', len(tri), 'triangles')

# hip measurements from the shorts before removing them
bp = mesh['primitives'][bots]; bpos = acc(bp['attributes']['POSITION'])
bjo = acc(bp['attributes']['JOINTS_0']); bwe = acc(bp['attributes']['WEIGHTS_0'])
cx, cz = float(bpos[:, 0].mean()), float(bpos[:, 2].mean())
waist_y = float(bpos[:, 1].max()) - 0.015
band = bpos[np.abs(bpos[:, 1] - waist_y) < 0.03]
rad = np.sqrt((band[:, 0] - cx) ** 2 + (band[:, 2] - cz) ** 2)
r_waist = float(np.percentile(rad, 85)) + 0.006
print('waist y %.3f radius %.3f centre %.3f %.3f' % (waist_y, r_waist, cx, cz))
mesh['primitives'].pop(bots)   # 2) remove the shorts

# skin joint indices
skin = j['skins'][j['nodes'][next(i for i, n in enumerate(j['nodes']) if n.get('mesh') == 0)]['skin']]
hb = j['extensions']['VRMC_vrm']['humanoid']['humanBones']
hips_node = hb['hips']['node']
J = lambda name: skin['joints'].index(hb[name]['node'])
jh = J('hips')
# world position of hips (VRM rest pose: translations only)
parent = {}
for i, n in enumerate(j['nodes']):
    for c in n.get('children', []): parent[c] = i
def world(i):
    p = np.zeros(3)
    while i is not None:
        p += np.array(j['nodes'][i].get('translation', [0, 0, 0])); i = parent.get(i)
    return p
hp = world(hips_node)

ROWS, COLS, K = 9, 48, 12
hem_y, flare = waist_y - 0.25, 1.75
def ring(f):
    return r_waist * (1 + (flare - 1) * (f ** 0.9))
# skirt bones: K chains (root at waist, mid, tip at hem), children of hips
ibm_old = acc(skin['inverseBindMatrices']).reshape(-1, 16)
new_ibm, chains = [], []
for k in range(K):
    a = 2 * np.pi * k / K
    pts = []
    for f in (0.0, 0.5, 1.0):
        rr = ring(f) * 0.97
        pts.append(np.array([cx + np.sin(a) * rr, waist_y - (waist_y - hem_y) * f, cz + np.cos(a) * rr]))
    ids, par, ppos = [], hips_node, hp
    for t, pw in enumerate(pts):
        j['nodes'].append({'name': f'J_Skirt_{k}_{t}', 'translation': (pw - ppos).tolist()})
        ni = len(j['nodes']) - 1
        j['nodes'][par].setdefault('children', []).append(ni)
        skin['joints'].append(ni)
        m = np.eye(4, dtype=np.float32); m[3, :3] = -pw   # column-major translation
        new_ibm.append(m.ravel())
        ids.append(len(skin['joints']) - 1); par, ppos = ni, pw
        chains_nodes = None
    chains.append(ids)
skin['inverseBindMatrices'] = add(np.vstack([ibm_old, np.array(new_ibm, np.float32)]).astype(np.float32), 5126, 'MAT4')

P, N, UV, JO, WE = [], [], [], [], []
for r in range(ROWS + 1):
    f = r / ROWS
    y = waist_y - (waist_y - hem_y) * f
    base = ring(f)
    for c in range(COLS):
        a = 2 * np.pi * c / COLS
        rr = base * (1 + (0.06 * f + 0.008) * (1 if c % 2 else -1))
        x, z = cx + np.sin(a) * rr, cz + np.cos(a) * rr
        P.append([x, y, z]); N.append([np.sin(a), 0.25, np.cos(a)]); UV.append([c / COLS, f])
        u = a / (2 * np.pi) * K; k0 = int(u) % K; k1 = (k0 + 1) % K; t = u - int(u)
        wh = max(0.0, 1 - f * 5)                       # waistband stays on the hips
        lo = 0.0 if f < 0.5 else (f - 0.5) / 0.5       # lower half follows the mid joint
        rest = 1 - wh
        JO.append([jh, chains[k0][0] if lo < 0.5 else chains[k0][1], chains[k1][0] if lo < 0.5 else chains[k1][1], 0])
        WE.append([wh, rest * (1 - t), rest * t, 0])
P = np.array(P, np.float32); N = np.array(N, np.float32); N /= np.linalg.norm(N, axis=1, keepdims=True)
UV = np.array(UV, np.float32); JO = np.array(JO, np.uint16); WE = np.array(WE, np.float32)
# spring physics for the skirt, colliding with the legs
sb = j['extensions']['VRMC_springBone']
legs = [i for i, g in enumerate(sb['colliderGroups']) if 'UpperLeg' in (g.get('name') or '')]
for k in range(K):
    nodes = [skin['joints'][i] for i in chains[k]]
    sb['springs'].append({'name': f'Skirt{k}', 'colliderGroups': legs, 'joints': [
        {'node': nodes[0], 'hitRadius': 0.02, 'stiffness': 0.9, 'gravityPower': 0.15, 'gravityDir': [0, -1, 0], 'dragForce': 0.35},
        {'node': nodes[1], 'hitRadius': 0.02, 'stiffness': 0.7, 'gravityPower': 0.15, 'gravityDir': [0, -1, 0], 'dragForce': 0.35},
        {'node': nodes[2], 'hitRadius': 0.0}]})
I = []
for r in range(ROWS):
    for c in range(COLS):
        a0, a1 = r * COLS + c, r * COLS + (c + 1) % COLS
        b0, b1 = a0 + COLS, a1 + COLS
        I += [a0, b0, a1, a1, b0, b1]
I = np.array(I, np.uint32)

mat = copy.deepcopy(j['materials'][bp['material']])
mat['name'] = 'Skirt_00_CLOTH'
mat.pop('pbrMetallicRoughness', None)
mat['pbrMetallicRoughness'] = {'baseColorFactor': [0.11, 0.14, 0.32, 1.0], 'metallicFactor': 0, 'roughnessFactor': 1}
mt = mat.get('extensions', {}).get('VRMC_materials_mtoon')
if mt:
    for k in ('shadeMultiplyTexture', 'matcapTexture', 'rimMultiplyTexture', 'outlineWidthMultiplyTexture', 'uvAnimationMaskTexture', 'shadingShiftTexture'):
        mt.pop(k, None)
    mt['shadeColorFactor'] = [0.06, 0.07, 0.18]
mat.pop('normalTexture', None); mat.pop('emissiveTexture', None)
mat['doubleSided'] = True
j['materials'].append(mat)

mesh['primitives'].append({
    'attributes': {'POSITION': add(P, 5126, 'VEC3', 34962, True), 'NORMAL': add(N, 5126, 'VEC3', 34962),
                   'TEXCOORD_0': add(UV, 5126, 'VEC2', 34962), 'JOINTS_0': add(JO, 5123, 'VEC4', 34962),
                   'WEIGHTS_0': add(WE, 5126, 'VEC4', 34962)},
    'indices': add(I, 5125, 'SCALAR', 34963), 'material': len(j['materials']) - 1, 'mode': 4})

# write GLB
while len(binbuf) % 4: binbuf.append(0)
j['buffers'][0]['byteLength'] = len(binbuf)
js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binbuf))
out += struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binbuf), b'BIN\x00') + bytes(binbuf)
open(dst, 'wb').write(out)
print('wrote', dst, len(out))
