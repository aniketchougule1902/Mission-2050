extends Node3D
class_name MissionWorld

var city: Node3D
var lab: Node3D
var lift: Node3D
var doors: Array[Node3D] = []
var doctor: Node3D
var reactor: Node3D
var cars: Array[Node3D] = []
var car_wheels: Array[Node3D] = []
var markers: Array[Node3D] = []
var obstacles: Array[Vector4] = []
var installed: int = 0
var elapsed: float = 0.0
const DISTRICT_CENTERS = [Vector2(-27,24), Vector2(-111,-85), Vector2(112,-109), Vector2(207,66), Vector2(-125,196)]
const STONE_COLORS = [Color("#efac55"),Color("#48c7f3"),Color("#65e29d"),Color("#6cddd6"),Color("#b89ff6")]

func _ready() -> void:
	city = Node3D.new()
	city.name = "Suryanagar"
	add_child(city)
	lab = Node3D.new()
	lab.name = "UndergroundResearchLab"
	lab.position.y = -24.0
	add_child(lab)
	_make_environment()
	_build_city()
	_build_lab()
	_build_elevator()
	set_in_lab(false)
	set_process(true)

func _make_environment() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("#91b5c4")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("#adc7cb")
	e.ambient_light_energy = 0.8
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.environment = e
	add_child(env)
	var sunlight := DirectionalLight3D.new()
	sunlight.rotation_degrees = Vector3(-55, 25, -20)
	sunlight.light_energy = 1.05
	sunlight.light_color = Color("#fff1d0")
	sunlight.shadow_enabled = false # inexpensive on mobile
	add_child(sunlight)

func material(c: Color, metal: float = 0.0, emission: float = 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.metallic = metal
	m.roughness = 0.62 if metal < 0.2 else 0.34
	if emission > 0.0:
		m.emission_enabled = true
		m.emission = c
		m.emission_energy_multiplier = emission
	return m

func box(p: Node3D, pos: Vector3, dimensions: Vector3, c: Color, metal: float = 0.0) -> MeshInstance3D:
	var n := MeshInstance3D.new()
	var geo := BoxMesh.new()
	geo.size = dimensions
	n.mesh = geo
	n.material_override = material(c, metal)
	n.position = pos
	p.add_child(n)
	return n

func cylinder(p: Node3D, pos: Vector3, radius: float, height: float, c: Color, emission: float = 0.0) -> MeshInstance3D:
	var n := MeshInstance3D.new()
	var geo := CylinderMesh.new()
	geo.top_radius = radius
	geo.bottom_radius = radius
	geo.height = height
	geo.radial_segments = 12
	n.mesh = geo
	n.material_override = material(c, 0.25, emission)
	n.position = pos
	p.add_child(n)
	return n

func sphere(p: Node3D, pos: Vector3, radius: float, c: Color, emission: float = 0.0) -> MeshInstance3D:
	var n := MeshInstance3D.new()
	var geo := SphereMesh.new()
	geo.radius = radius
	geo.height = radius * 2.0
	geo.radial_segments = 12
	geo.rings = 6
	n.mesh = geo
	n.material_override = material(c, 0.15, emission)
	n.position = pos
	p.add_child(n)
	return n

func _solid_floor(p: Node3D, at: Vector3, size: Vector3) -> void:
	var body := StaticBody3D.new()
	var hit := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	hit.shape = shape
	body.position = at
	body.add_child(hit)
	p.add_child(body)

func _multimesh(p: Node3D, mesh: Mesh, transforms: Array[Transform3D], hues: Array[Color]) -> void:
	if transforms.is_empty():
		return
	var inst := MultiMeshInstance3D.new()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = transforms.size()
	for i in range(transforms.size()):
		mm.set_instance_transform(i, transforms[i])
		mm.set_instance_color(i, hues[i])
	inst.multimesh = mm
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color.WHITE
	mat.vertex_color_use_as_albedo = true
	mat.roughness = 0.8
	inst.material_override = mat
	p.add_child(inst)

func _near_objective(x: float, z: float) -> bool:
	var focus := [Vector2(24, 32),Vector2(24,41),Vector2(-14,24),Vector2(-34,8),Vector2(-49,29),Vector2(-46,34),Vector2(-108,-73),Vector2(-119,-75),Vector2(-116,-84),Vector2(-106,-92),Vector2(99,-86),Vector2(93,-104),Vector2(93,-123),Vector2(116,-106),Vector2(117,-124),Vector2(136,-126),Vector2(214,40),Vector2(221,76),Vector2(198,65),Vector2(212,69),Vector2(-121,194),Vector2(-125,191),Vector2(-140,202)]
	for f in focus:
		if Vector2(x,z).distance_to(f) < 19.0:
			return true
	return false

func _build_city() -> void:
	box(city, Vector3(0,-0.23,0), Vector3(610,0.4,610), Color("#546e5c"))
	_solid_floor(city,Vector3(0,-0.43,0),Vector3(610,0.4,610))
	for v in range(-240,241,60):
		box(city,Vector3(v,-0.01,0),Vector3(12,0.06,600),Color("#364650"))
		box(city,Vector3(0,0,v),Vector3(600,0.06,12),Color("#364650"))
	var meshes: Array[Transform3D] = []
	var tones: Array[Color] = []
	var building := BoxMesh.new()
	building.size = Vector3.ONE
	for xi in range(-9,10):
		for zi in range(-9,10):
			var x: float = float(xi * 27 + 12)
			var z: float = float(zi * 27 + 12)
			if absf(fposmod(x + 30.0,60.0) - 30.0) < 12.0 or absf(fposmod(z + 30.0,60.0) - 30.0) < 12.0:
				continue
			if _near_objective(x,z):
				continue
			var h: float = 7.0 + float(posmod(xi * 37 + zi * 19,12))
			var w: float = 10.0 + float(posmod(xi * 7 + zi * 3,7))
			var d: float = 10.0 + float(posmod(xi * 5 + zi * 11,8))
			var xf := Transform3D(Basis.IDENTITY.scaled(Vector3(w,h,d)),Vector3(x,h * 0.5,z))
			meshes.append(xf)
			var hue := Color("#667a83")
			if x < -50.0 and z < -20.0:
				hue = Color("#8aa1b2")
			elif x > 60.0 and z < 0.0:
				hue = Color("#668e7a")
			elif x > 130.0:
				hue = Color("#88a0a3")
			elif z > 90.0:
				hue = Color("#92849f")
			tones.append(hue.lightened(float(posmod(xi * 3 + zi * 7,8)) * 0.025))
			obstacles.append(Vector4(x,z,w * 0.5,d * 0.5))
	_multimesh(city,building,meshes,tones)
	var tree_mesh := SphereMesh.new()
	tree_mesh.radius = 1.0
	tree_mesh.height = 2.0
	tree_mesh.radial_segments = 8
	tree_mesh.rings = 4
	var crowns: Array[Transform3D] = []
	var colors: Array[Color] = []
	for i in range(145):
		var x: float = float(posmod(i * 71 + 23,546) - 273)
		var z: float = float(posmod(i * 137 + 39,546) - 273)
		if _near_objective(x,z) or absf(fposmod(x + 30.0,60.0) - 30.0) > 21.0:
			continue
		crowns.append(Transform3D(Basis.IDENTITY.scaled(Vector3(2.2,3.2,2.2)),Vector3(x,4.8,z)))
		colors.append(Color("#416e53") if i % 2 == 0 else Color("#589165"))
	_multimesh(city,tree_mesh,crowns,colors)
	for i in range(5):
		var p: Vector2 = DISTRICT_CENTERS[i]
		cylinder(city,Vector3(p.x,0.16,p.y),9.0,0.25,STONE_COLORS[i].darkened(0.55))
		for arm in range(4):
			var a: float = float(arm) * TAU / 4.0
			box(city,Vector3(p.x + sin(a) * 10.5,1.5,p.y + cos(a) * 10.5),Vector3(1,3,1),STONE_COLORS[i])
	for sx in [-3.7,3.7]:
		box(city,Vector3(24+sx,1.75,32),Vector3(0.6,3.5,6),Color("#273f4b"),0.5)
	box(city,Vector3(24,3.7,32),Vector3(9,0.7,7),Color("#58b1b7"),0.4)
	box(city,Vector3(24,1.4,35),Vector3(8,2.8,0.4),Color("#273f4b"),0.5)
	for i in range(8):
		var auto := Node3D.new()
		auto.name = "Traffic"
		city.add_child(auto)
		box(auto,Vector3(0,0.75,0),Vector3(1.8,0.8,3.2),Color("#8ca3ad") if i % 2 == 0 else Color("#be8d61"),0.3)
		box(auto,Vector3(0,1.3,0.2),Vector3(1.5,0.65,1.5),Color("#263d4b"))
		for sx in [-0.9,0.9]:
			for sz in [-1.0,1.0]:
				var wh := cylinder(auto,Vector3(sx,0.4,sz),0.35,0.2,Color("#1b252c"))
				wh.rotation_degrees.z = 90
				car_wheels.append(wh)
		cars.append(auto)

func _build_lab() -> void:
	box(lab,Vector3(24,-0.4,16),Vector3(34,0.7,34),Color("#253c47"),0.45)
	_solid_floor(lab,Vector3(24,-0.7,16),Vector3(34,0.6,34))
	for z in [-1.0,33.0]:
		box(lab,Vector3(24,3.1,z),Vector3(35,6.2,0.7),Color("#334c5c"),0.35)
	for x in [7.0,41.0]:
		box(lab,Vector3(x,3.1,16),Vector3(0.7,6.2,34),Color("#334c5c"),0.35)
	for x in [13.0,35.0]:
		for z in [5.0,28.0]:
			cylinder(lab,Vector3(x,3.0,z),0.35,6,Color("#526a77"),0.7)
	reactor = Node3D.new()
	reactor.position = Vector3(24,0,16)
	lab.add_child(reactor)
	cylinder(reactor,Vector3(0,0.6,0),3.1,1.2,Color("#3c5767"))
	cylinder(reactor,Vector3(0,2.2,0),1.35,3.0,Color("#59d0df"),2.5)
	cylinder(reactor,Vector3(0,4.3,0),2.6,0.4,Color("#a3afb7"),0.6)
	for i in range(5):
		var angle: float = float(i) * TAU / 5.0
		cylinder(reactor,Vector3(sin(angle)*2.5,1.35,cos(angle)*2.5),0.42,0.28,STONE_COLORS[i].darkened(0.7),0.4)
	var core_light := OmniLight3D.new()
	core_light.position = Vector3(24,3,16)
	core_light.light_color = Color("#83dfeb")
	core_light.light_energy = 2.8
	core_light.omni_range = 19
	lab.add_child(core_light)
	doctor = Node3D.new()
	doctor.position = Vector3(22,0,27)
	lab.add_child(doctor)
	_make_person(doctor,Color("#e5edef"),Color("#293d4a"))
	for x in [18.0,30.0]:
		for z in [5.0,25.0]:
			var guard := Node3D.new()
			guard.position = Vector3(x,0,z)
			lab.add_child(guard)
			_make_person(guard,Color("#435d70"),Color("#1f3240"))
	install_stones(0)

func _make_person(p: Node3D, shirt: Color, pants: Color) -> void:
	cylinder(p,Vector3(0,0.96,0),0.31,1.08,shirt)
	sphere(p,Vector3(0,1.66,0),0.23,Color("#bd936f"))
	for x in [-0.16,0.16]:
		box(p,Vector3(x,0.27,0),Vector3(0.16,0.54,0.17),pants)
	for x in [-0.38,0.38]:
		box(p,Vector3(x,1.0,0),Vector3(0.18,0.7,0.17),shirt)

func _build_elevator() -> void:
	lift = Node3D.new()
	lift.position = Vector3(24,0,32)
	add_child(lift)
	box(lift,Vector3(0,-0.1,0),Vector3(3.5,0.2,3.6),Color("#8198a2"),0.8)
	box(lift,Vector3(0,3.0,0),Vector3(3.5,0.2,3.6),Color("#45596a"),0.6)
	for x in [-1.72,1.72]:
		box(lift,Vector3(x,1.5,-1.65),Vector3(0.1,3.1,0.12),Color("#86d6df"),0.5)
	for side in [-1.0,1.0]:
		var door := Node3D.new()
		door.position = Vector3(side * 0.84,0,-1.82)
		lift.add_child(door)
		box(door,Vector3(0,1.5,0),Vector3(1.66,3,0.12),Color("#334b5d"),0.7)
		doors.append(door)

func animate_doors(open: bool) -> Tween:
	var t := create_tween()
	t.set_parallel(true)
	for i in range(doors.size()):
		var sign: float = -1.0 if i == 0 else 1.0
		t.tween_property(doors[i],"position:x",sign * (1.6 if open else 0.84),0.55)
	return t

func set_in_lab(value: bool) -> void:
	city.visible = not value
	lab.visible = value
	if not value:
		lift.position.y = 0.0
	else:
		lift.position.y = -24.0

func install_stones(count: int) -> void:
	installed = count
	if reactor == null:
		return
	for i in range(5):
		var name := "Stone" + str(i)
		var old := reactor.get_node_or_null(name)
		if old != null:
			old.queue_free()
		if i < count:
			var a := float(i) * TAU / 5.0
			var s := Node3D.new()
			s.name = name
			s.position = Vector3(sin(a)*2.5,1.7,cos(a)*2.5)
			reactor.add_child(s)
			sphere(s,Vector3.ZERO,0.36,STONE_COLORS[i],2.8)

func show_actions(actions: Array, underground: bool) -> void:
	for node in markers:
		if is_instance_valid(node):
			node.queue_free()
	markers.clear()
	for action in actions:
		var position3: Vector3 = action.pos
		var root := Node3D.new()
		root.position = position3
		(lab if underground else city).add_child(root)
		var col := Color("#eed28a")
		if action.id == "gem":
			col = STONE_COLORS[mini(installed,4)]
		elif action.id == "lift":
			col = Color("#5ed9e4")
		var ring := cylinder(root,Vector3(0,0.06,0),0.7,0.09,col,0.65)
		var flag := sphere(root,Vector3(0,1.45,0),0.21,col,1.8)
		flag.name = "Waypoint"
		markers.append(root)

func blocked(at: Vector3, underground: bool, stage: int) -> bool:
	if underground:
		return at.x < 8.5 or at.x > 39.5 or at.z < 0.0 or at.z > 32.3 or Vector2(at.x,at.z).distance_to(Vector2(24,16)) < 3.25
	if absf(at.x) > 295.0 or absf(at.z) > 295.0:
		return true
	var p := Vector2(at.x,at.z)
	if p.distance_to(Vector2(24,32)) > 20.0 and p.length() > 45.0:
		var valid := false
		for i in range(stage + 1):
			if i > 4:
				break
			var c: Vector2 = DISTRICT_CENTERS[i]
			if p.distance_to(c) < (82.0 if i > 2 else 75.0):
				valid = true
			var rel := p.dot(c) / maxf(c.length_squared(),1.0)
			var projected: Vector2 = c * clampf(rel,0.0,1.0)
			if p.distance_to(projected) < 15.0:
				valid = true
		if not valid:
			return true
	for o in obstacles:
		if absf(at.x-o.x) < o.z + 0.42 and absf(at.z-o.y) < o.w + 0.42:
			return true
	return false

func _process(delta: float) -> void:
	elapsed += delta
	for i in range(cars.size()):
		var dir: float = 1.0 if i % 2 == 0 else -1.0
		var z: float = fposmod(elapsed * 7.0 * dir + float(i) * 65.0 + 300.0,600.0) - 300.0
		cars[i].position = Vector3(3.0 if dir > 0.0 else -3.0,0,z)
		cars[i].rotation.y = 0.0 if dir < 0.0 else PI
	for m in markers:
		if is_instance_valid(m):
			var ico := m.get_node_or_null("Waypoint")
			if ico == null:
				ico = m.get_node_or_null("Waypoint") # sphere is direct named child
			if ico != null:
				ico.position.y = 1.45 + sin(elapsed*2.5)*0.16
	if reactor != null:
		reactor.rotation.y = sin(elapsed*0.45) * 0.03
