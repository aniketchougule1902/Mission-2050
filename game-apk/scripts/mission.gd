extends Node3D
# Native Godot 4 3D application; no HTTP requests, embedded browser or online assets.
const SAVE_FILE = "user://mission2050_native_v1.json"
const WORLD_SCRIPT = preload("res://scripts/world.gd")
const JOYSTICK_SCRIPT = preload("res://scripts/joystick.gd")
const COSTS = {"buses":50,"cycling":20,"backup":15,"training":15,"roads":35,"petrol":30}
const STAGES = ["Power & Health","Solar Rooftops","Rewilding","Clean River","Resilient Transport"]

var world: MissionWorld
var player: CharacterBody3D
var appearance: Node3D
var left_leg: Node3D
var right_leg: Node3D
var left_arm: Node3D
var right_arm: Node3D
var camera: Camera3D
var van: Node3D
var joystick
var hud: Control
var ui_layer: CanvasLayer
var menu: PanelContainer
var objective_label: Label
var detail_label: Label
var meters_label: Label
var radar_label: Label
var prompt_label: Label
var toast_label: Label
var stage: int = 0
var assembled: int = 0
var stone: int = -1
var in_lab := false
var busy := false
var paused := true
var driving := false
var run_held := false
var camera_yaw := 0.0
var camera_distance := 7.8
var jump_requested := false
var tasks: Dictionary = {}
var budget: Array[String] = []
var decisions: Array[String] = []
var night_result := ""
var ending := ""
var actions: Array[Dictionary] = []
var ui_tick := 0.0
var anim_clock := 0.0
var notice_seconds := 0.0
var menu_open := true
var cached_save: Dictionary = {}

func _ready() -> void:
	world = WORLD_SCRIPT.new()
	add_child(world)
	_setup_character()
	_setup_vehicle()
	_setup_camera()
	_setup_hud()
	_load_save()
	_build_actions()
	_show_menu()
	_update_hud()
	set_process(true)
	set_physics_process(true)

func _setup_character() -> void:
	player = CharacterBody3D.new()
	player.name = "Asha"
	player.position = Vector3(24,0.12,41)
	add_child(player)
	var hit := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.33
	capsule.height = 1.7
	hit.shape = capsule
	hit.position.y = 0.9
	player.add_child(hit)
	appearance = Node3D.new()
	player.add_child(appearance)
	world.cylinder(appearance,Vector3(0,1.1,0),0.31,0.8,Color("#dcaa62"))
	world.sphere(appearance,Vector3(0,1.65,0),0.23,Color("#b78768"))
	world.box(appearance,Vector3(0,1.87,-0.02),Vector3(0.46,0.12,0.46),Color("#293c4d"))
	left_leg = _limb(Vector3(-0.17,0.7,0),Vector3(0.17,0.65,0.2),Color("#283e5b"))
	right_leg = _limb(Vector3(0.17,0.7,0),Vector3(0.17,0.65,0.2),Color("#283e5b"))
	left_arm = _limb(Vector3(-0.41,1.37,0),Vector3(0.16,0.66,0.19),Color("#c59454"))
	right_arm = _limb(Vector3(0.41,1.37,0),Vector3(0.16,0.66,0.19),Color("#c59454"))
	world.box(appearance,Vector3(0,1.1,-0.33),Vector3(0.44,0.3,0.15),Color("#416778"))

func _limb(origin: Vector3, size: Vector3, color: Color) -> Node3D:
	var pivot := Node3D.new()
	pivot.position = origin
	appearance.add_child(pivot)
	world.box(pivot,Vector3(0,-size.y * 0.45,0),size,color)
	return pivot

func _setup_vehicle() -> void:
	van = Node3D.new()
	van.name = "ElectricUtilityVehicle"
	world.city.add_child(van)
	van.position = Vector3(14,0,34)
	world.box(van,Vector3(0,0.8,0),Vector3(2.2,0.7,3.8),Color("#e9b655"),0.4)
	world.box(van,Vector3(0,1.5,0.2),Vector3(1.85,0.85,1.7),Color("#345361"),0.5)
	for x in [-1.12,1.12]:
		for z in [-1.3,1.3]:
			var wheel := world.cylinder(van,Vector3(x,0.45,z),0.46,0.26,Color("#20292c"))
			wheel.rotation_degrees.z = 90.0
	for x in [-0.75,0.75]:
		world.box(van,Vector3(x,0.9,-1.92),Vector3(0.25,0.19,0.08),Color("#ffecae"))
		world.box(van,Vector3(x,0.9,1.92),Vector3(0.25,0.19,0.08),Color("#ee6355"))

func _setup_camera() -> void:
	camera = Camera3D.new()
	camera.name = "ChaseCamera"
	camera.current = true
	camera.fov = 68.0
	camera.near = 0.08
	camera.far = 185.0
	add_child(camera)
	camera.position = Vector3(24,6.0,50)

func _text(parent: Control, value: String, size: int, tint: Color = Color.WHITE) -> Label:
	var label := Label.new()
	label.text = value
	label.add_theme_font_size_override("font_size",size)
	label.add_theme_color_override("font_color",tint)
	label.add_theme_color_override("font_outline_color",Color("#0b1922"))
	label.add_theme_constant_override("outline_size",5)
	parent.add_child(label)
	return label

func _hud_button(value: String, right: float, bottom: float, width: float = 114.0, height: float = 72.0) -> Button:
	var btn := Button.new()
	btn.text = value
	btn.anchor_left = 1.0
	btn.anchor_right = 1.0
	btn.anchor_top = 1.0
	btn.anchor_bottom = 1.0
	btn.offset_left = -right-width
	btn.offset_right = -right
	btn.offset_top = -bottom-height
	btn.offset_bottom = -bottom
	btn.add_theme_font_size_override("font_size",23)
	btn.add_theme_color_override("font_color",Color("#f8f4dc"))
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05,0.18,0.23,0.83)
	style.border_color = Color("#6bcfda")
	style.set_border_width_all(2)
	style.set_corner_radius_all(12)
	btn.add_theme_stylebox_override("normal",style)
	var hot := style.duplicate() as StyleBoxFlat
	hot.bg_color = Color("#237b81")
	btn.add_theme_stylebox_override("pressed",hot)
	hud.add_child(btn)
	return btn

func _setup_hud() -> void:
	ui_layer = CanvasLayer.new()
	add_child(ui_layer)
	hud = Control.new()
	hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui_layer.add_child(hud)
	var panel := PanelContainer.new()
	panel.offset_left = 14
	panel.offset_top = 14
	panel.offset_right = 550
	panel.offset_bottom = 174
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05,0.12,0.16,0.79)
	style.set_corner_radius_all(10)
	style.content_margin_left = 14
	style.content_margin_top = 10
	style.content_margin_right = 12
	style.content_margin_bottom = 8
	panel.add_theme_stylebox_override("panel",style)
	hud.add_child(panel)
	var columns := VBoxContainer.new()
	panel.add_child(columns)
	objective_label = _text(columns,"MISSION 2050",24,Color("#f6cf85"))
	detail_label = _text(columns,"Explore the city",17)
	detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	meters_label = _text(columns,"5 STONES  |  OFFLINE",16,Color("#7fe4df"))
	radar_label = _text(hud,"",18,Color("#ffdc88"))
	radar_label.anchor_left = 0.5
	radar_label.anchor_right = 0.5
	radar_label.anchor_top = 0.0
	radar_label.offset_left = -210
	radar_label.offset_right = 290
	radar_label.offset_top = 20
	radar_label.offset_bottom = 82
	radar_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_label = _text(hud,"",21,Color("#f3e4bf"))
	prompt_label.anchor_left = 0.5
	prompt_label.anchor_right = 0.5
	prompt_label.anchor_top = 1.0
	prompt_label.anchor_bottom = 1.0
	prompt_label.offset_left = -290
	prompt_label.offset_right = 290
	prompt_label.offset_top = -150
	prompt_label.offset_bottom = -90
	prompt_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_label = _text(hud,"",24,Color("#c9f7e8"))
	toast_label.anchor_left = 0.25
	toast_label.anchor_right = 0.75
	toast_label.offset_left = 0
	toast_label.offset_right = 0
	toast_label.offset_top = 205
	toast_label.offset_bottom = 270
	toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	joystick = Control.new()
	joystick.set_script(JOYSTICK_SCRIPT)
	joystick.anchor_top = 1.0
	joystick.anchor_bottom = 1.0
	joystick.offset_left = 20
	joystick.offset_right = 256
	joystick.offset_top = -263
	joystick.offset_bottom = -27
	hud.add_child(joystick)
	_hud_button("ACT",22,42,121,104).pressed.connect(_do_interaction)
	var run_button := _hud_button("RUN",155,39,100,77)
	run_button.button_down.connect(_run_down)
	run_button.button_up.connect(_run_up)
	_hud_button("DRIVE",25,164,100,63).pressed.connect(_toggle_drive)
	_hud_button("CAM",137,164,100,63).pressed.connect(_cycle_camera)
	_hud_button("PAUSE",16,616,104,56).pressed.connect(_toggle_pause)
	_hud_button("MAP",132,616,94,56).pressed.connect(_show_map)
	hud.visible = false

func _show_menu() -> void:
	menu_open = true
	paused = true
	hud.visible = false
	if menu != null:
		menu.queue_free()
	menu = PanelContainer.new()
	menu.anchor_left = 0.5
	menu.anchor_right = 0.5
	menu.anchor_top = 0.5
	menu.anchor_bottom = 0.5
	menu.offset_left = -330
	menu.offset_right = 330
	menu.offset_top = -240
	menu.offset_bottom = 240
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#0b2631")
	style.border_color = Color("#58bac5")
	style.set_border_width_all(3)
	style.set_corner_radius_all(18)
	style.content_margin_left = 30
	style.content_margin_right = 30
	style.content_margin_top = 26
	style.content_margin_bottom = 24
	menu.add_theme_stylebox_override("panel",style)
	ui_layer.add_child(menu)
	var box_layout := VBoxContainer.new()
	box_layout.add_theme_constant_override("separation",18)
	menu.add_child(box_layout)
	var title := _text(box_layout,"MISSION 2050  ·  AAKHRI SAANS",31,Color("#f5d59a"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var desc := _text(box_layout,"NATIVE 3D  •  OFFLINE  •  FIVE DISTRICTS\nExplore Suryanagar, recover five stones and power the reactor.",18)
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var resume := Button.new()
	resume.text = "CONTINUE ADVENTURE" if not cached_save.is_empty() else "START ADVENTURE"
	resume.custom_minimum_size.y = 66
	resume.add_theme_font_size_override("font_size",24)
	resume.pressed.connect(_resume_game)
	box_layout.add_child(resume)
	var fresh := Button.new()
	fresh.text = "NEW ADVENTURE (RESET SAVE)"
	fresh.custom_minimum_size.y = 60
	fresh.pressed.connect(_reset_and_play)
	box_layout.add_child(fresh)
	var hints := _text(box_layout,"Touch: left joystick to move, swipe right side to rotate camera.\nACT to interact • DRIVE near the electric car • RUN to sprint.\nKeyboard: WASD, E, F, Shift, Space, C, Esc.",16,Color("#b4d4dc"))
	hints.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

func _run_down() -> void:
	run_held = true

func _run_up() -> void:
	run_held = false

func _reset_and_play() -> void:
	_new_game()
	_resume_game()

func _resume_game() -> void:
	menu_open = false
	paused = false
	if is_instance_valid(menu):
		menu.queue_free()
		menu = null
	hud.visible = true
	_notify("Find the glowing waypoint. All progress is saved locally.")

func _new_game() -> void:
	stage = 0
	assembled = 0
	stone = -1
	in_lab = false
	driving = false
	busy = false
	tasks = {}
	budget = []
	decisions = []
	night_result = ""
	ending = ""
	cached_save = {}
	player.position = Vector3(24,0.12,41)
	appearance.visible = true
	van.position = Vector3(14,0,34)
	world.set_in_lab(false)
	world.install_stones(0)
	_build_actions()
	_save_game()

func _save_game() -> void:
	var dict := {"v":1,"stage":stage,"assembled":assembled,"stone":stone,"lab":in_lab,
		"x":player.position.x,"z":player.position.z,"tasks":tasks,"budget":budget,
		"decisions":decisions,"night":night_result,"ending":ending}
	var file := FileAccess.open(SAVE_FILE,FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify(dict))

func _load_save() -> void:
	if not FileAccess.file_exists(SAVE_FILE):
		return
	var file := FileAccess.open(SAVE_FILE,FileAccess.READ)
	if file == null:
		return
	var raw: Variant = JSON.parse_string(file.get_as_text())
	if typeof(raw) != TYPE_DICTIONARY:
		return
	var d: Dictionary = raw
	var number: int = int(d.get("assembled",-1))
	if int(d.get("v",0)) != 1 or number < 0 or number > 5 or int(d.get("stage",-1)) != mini(number,4):
		return
	if not (d.get("tasks",null) is Dictionary) or not (d.get("budget",null) is Array) or not (d.get("decisions",null) is Array):
		return
	var held: int = int(d.get("stone",-2))
	if held != -1 and held != number:
		return
	if number == 5 and held != -1:
		return
	assembled = number
	stage = mini(number,4)
	stone = held
	tasks = d.tasks
	for id in d.budget:
		if id is String and COSTS.has(id) and not budget.has(id):
			budget.append(id)
	if _budget_total() > 100:
		budget.clear()
	for id in d.decisions:
		if id is String and decisions.size() < 4:
			decisions.append(id)
	night_result = str(d.get("night",""))
	ending = str(d.get("ending",""))
	in_lab = bool(d.get("lab",false))
	var x: float = clampf(float(d.get("x",24)), -285.0,285.0)
	var z: float = clampf(float(d.get("z",41)), -285.0,285.0)
	player.position = Vector3(x,-23.88 if in_lab else 0.12,z)
	world.set_in_lab(in_lab)
	world.install_stones(assembled)
	cached_save = d

func _action(id: String, title: String, x: float, z: float, kind: String = "work") -> Dictionary:
	return {"id":id,"label":title,"pos":Vector3(x,0,z),"kind":kind}

func _done(id: String) -> bool:
	return bool(tasks.get(id,false))

func _build_actions() -> void:
	actions.clear()
	if ending != "":
		world.show_actions(actions,in_lab)
		return
	if in_lab:
		actions.append(_action("lift","Elevator: return to street",24,32,"lift"))
		if stone >= 0:
			actions.append(_action("assemble","Give the stone to Dr. Meera",22,27))
		elif assembled == 5:
			actions.append(_action("activate","Activate final reactor",24,21))
		else:
			actions.append(_action("brief","Speak to Dr. Meera",22,27))
	else:
		if stone >= 0 or assembled == 5:
			actions.append(_action("lift","Elevator to research lab",24,32,"lift"))
		elif stage == 0:
			if not _done("fuse"):
				actions.append(_action("fuse","Recover microgrid fuse",-14,24))
			elif not _done("power"):
				actions.append(_action("efficiency","Clean efficiency upgrade",-34,8))
				actions.append(_action("coal","Coal backup (higher emissions)",-39,8))
			elif not _done("circuit"):
				actions.append(_action("circuit","Repair power circuit",-49,29))
			elif not _done("clinic"):
				actions.append(_action("clinic","Restore clinic power",-47,34))
			else:
				actions.append(_action("gem","Collect amber energy stone",-46,29,"gem"))
		elif stage == 1:
			if not _done("panels"):
				actions.append(_action("panels","Collect solar panels",-108,-73))
			else:
				var locations := {"panel1":Vector2(-119,-75),"panel2":Vector2(-116,-84),"panel3":Vector2(-106,-92),"shade":Vector2(-120,-92)}
				var completed := 0
				for id in locations:
					if _done(id):
						completed += 1
				if completed < 3:
					for id in locations:
						if not _done(id):
							var p: Vector2 = locations[id]
							actions.append(_action(id,"Install solar / shade at "+id,p.x,p.y))
				else:
					actions.append(_action("gem","Collect azure solar stone",-108,-84,"gem"))
		elif stage == 2:
			if not _done("stakes"):
				actions.append(_action("stakes","Collect habitat stakes",99,-86))
			elif not _done("housing1") or not _done("housing2"):
				if not _done("housing1"):
					actions.append(_action("housing1","Mark first habitat",93,-104))
				if not _done("housing2"):
					actions.append(_action("housing2","Mark second habitat",93,-123))
			elif not _done("grove"):
				actions.append(_action("grove","Protect the grove",116,-106))
				actions.append(_action("clear","Clear grove (ecological cost)",105,-106))
			elif not _done("water1") or not _done("water2"):
				if not _done("water1"):
					actions.append(_action("water1","Water western saplings",117,-124))
				if not _done("water2"):
					actions.append(_action("water2","Water eastern saplings",136,-126))
			else:
				actions.append(_action("gem","Collect emerald habitat stone",106,-97,"gem"))
		elif stage == 3:
			var scan_positions := {"scan1":Vector2(214,40),"scan2":Vector2(221,76),"scan3":Vector2(198,65)}
			for id in scan_positions:
				if not _done(id):
					var p: Vector2 = scan_positions[id]
					actions.append(_action(id,"Record river sample "+id,p.x,p.y))
			if _done("scan1") and _done("scan2") and _done("scan3"):
				if not _done("valve"):
					actions.append(_action("valve","Stop polluting outfall",222,72))
					actions.append(_action("litter","Surface litter cleanup",213,64))
				else:
					actions.append(_action("gem","Collect turquoise river stone",212,69,"gem"))
		elif stage == 4:
			if not _done("cargo"):
				actions.append(_action("cargo","Load electric delivery supplies",14,34))
			elif not _done("depotDelivery"):
				actions.append(_action("depotDelivery","Deliver to transport depot",-121,194))
			elif not _done("clinicDelivery"):
				actions.append(_action("clinicDelivery","Deliver to clinic",-46,33))
			else:
				var names := ["buses","cycling","backup","training","roads","petrol"]
				for i in range(names.size()):
					var id: String = names[i]
					var suffix := "✓" if budget.has(id) else "+"
					actions.append(_action("budget:"+id,suffix+" "+id+"  "+str(COSTS[id])+" credits",-140.0+float(i)*6.0,202))
				actions.append(_action("night","Run night resilience test",-125,191))
				if night_result != "":
					if night_result == "critical":
						actions.append(_action("override","Recover emergency stone",-116,193,"gem"))
					else:
						actions.append(_action("gem","Collect violet resilience stone",-116,193,"gem"))
	world.show_actions(actions,in_lab)

func _nearest() -> Dictionary:
	var candidate: Dictionary = {}
	var nearest_distance := INF
	for item in actions:
		var a: Dictionary = item
		var p: Vector3 = a.pos
		if in_lab:
			p.y = -24.0
		var distance: float = player.position.distance_to(p)
		if distance < nearest_distance:
			nearest_distance = distance
			candidate = a
	return candidate

func _nearest_distance(a: Dictionary) -> float:
	if a.is_empty():
		return INF
	var pos: Vector3 = a.pos
	if in_lab:
		pos.y = -24.0
	return player.position.distance_to(pos)

func _do_interaction() -> void:
	if paused or busy or menu_open:
		return
	var a := _nearest()
	if a.is_empty():
		return
	if _nearest_distance(a) > 4.0:
		_notify("Move to the glowing marker before interacting.")
		return
	if driving and a.id != "lift":
		_notify("Exit your vehicle before performing field work.")
		return
	if a.id == "lift":
		_use_lift()
		return
	if a.id == "assemble":
		_handover_stone()
		return
	if a.id == "activate":
		_finish_adventure()
		return
	if a.id == "brief":
		_notify("Dr. Meera: Bring the next district's stone to this reactor.")
		return
	if a.id.begins_with("budget:"):
		var id := a.id.trim_prefix("budget:")
		if budget.has(id):
			budget.erase(id)
		elif _budget_total() + int(COSTS[id]) <= 100:
			budget.append(id)
		else:
			_notify("Budget cannot exceed 100 credits.")
			return
		night_result = ""
		_notify("Transport budget: "+str(_budget_total())+" / 100")
	elif a.id == "night":
		night_result = _evaluate_ending()
		_notify("Night trial: "+night_result.to_upper()+" — "+str(_budget_total())+" credits spent.")
	elif a.id == "gem" or a.id == "override":
		if stage < 4:
			var choice := "efficiency" if stage == 0 and not _done("coal") else "coal"
			if stage == 1:
				choice = "tower" if _done("shade") else "school"
			elif stage == 2:
				choice = "clear" if _done("clear") else "infill"
			elif stage == 3:
				choice = "plastic" if _done("litter") else "effluent"
			decisions.append(choice)
		stone = stage
		_notify("STONE RECOVERED! Return to the roadside lab elevator.")
	elif a.id == "efficiency" or a.id == "coal":
		tasks["power"] = true
		tasks[a.id] = true
		_notify("Power plan applied: "+a.label)
	elif a.id == "grove" or a.id == "clear":
		tasks["grove"] = true
		tasks[a.id] = true
		_notify("Land-use plan applied: "+a.label)
	elif a.id == "valve" or a.id == "litter":
		tasks["valve"] = true
		tasks[a.id] = true
		_notify("River remediation recorded.")
	else:
		tasks[a.id] = true
		_notify("Objective completed: "+a.label)
	_build_actions()
	_save_game()
	_update_hud()

func _budget_total() -> int:
	var total := 0
	for id in budget:
		total += int(COSTS[id])
	return total

func _evaluate_ending() -> String:
	var carbon := 82
	var energy := 18
	var ecosystem := 15
	var reserve := 4
	var workers := 0
	var access := 0
	if decisions.size() > 0:
		if decisions[0] == "coal":
			carbon += 18
			energy += 4
			ecosystem -= 4
			reserve += 12
			workers += 1
		else:
			carbon -= 16
			energy += 12
			reserve += 8
			workers += 1
	if decisions.size() > 1:
		if decisions[1] == "tower":
			carbon -= 8
			energy += 18
		else:
			carbon -= 12
			energy += 24
	if decisions.size() > 2:
		if decisions[2] == "clear":
			carbon += 8
			ecosystem -= 20
		else:
			carbon -= 10
			ecosystem += 28
	if decisions.size() > 3:
		ecosystem += 22 if decisions[3] == "effluent" else 5
	if budget.has("buses"):
		carbon -= 18
		reserve -= 14
	if budget.has("cycling"):
		carbon -= 8
		access += 1
	if budget.has("backup"):
		reserve += 16
		energy += 8
	if budget.has("training"):
		workers += 2
		access += 1
	if budget.has("roads"):
		carbon += 10
	if budget.has("petrol"):
		carbon += 15
	var safe := reserve >= 10 and workers >= 1 and (budget.has("buses") or budget.has("cycling"))
	var green := safe and carbon <= 40 and energy >= 45 and ecosystem >= 60 and decisions.has("effluent") and access >= 1
	return "green" if green else ("survival" if safe else "critical")

func _use_lift() -> void:
	if driving:
		_toggle_drive()
	busy = true
	_notify("Elevator travelling 24 metres. Controls locked for safety.")
	world.animate_doors(false)
	var destination_y: float = 0.0 if in_lab else -24.0
	var ride := create_tween()
	ride.set_parallel(true)
	ride.set_trans(Tween.TRANS_SINE)
	ride.set_ease(Tween.EASE_IN_OUT)
	ride.tween_property(world.lift,"position:y",destination_y,4.0)
	ride.tween_property(player,"position:y",destination_y + 0.12,4.0)
	await get_tree().create_timer(2.1).timeout
	world.lab.visible = not in_lab
	world.city.visible = in_lab
	await ride.finished
	in_lab = not in_lab
	world.set_in_lab(in_lab)
	player.position = Vector3(24, destination_y + 0.12,32)
	world.animate_doors(true)
	busy = false
	_build_actions()
	_save_game()
	_notify("Arrived: underground research lab" if in_lab else "Arrived: Suryanagar")

func _handover_stone() -> void:
	if stone != assembled:
		_notify("Wrong socket order.")
		return
	busy = true
	_notify("Dr. Meera is carrying the energy stone to the reactor.")
	var start: Vector3 = world.doctor.position
	var angle := float(assembled) * TAU / 5.0
	var destination := Vector3(24 + sin(angle)*4.4,0,16 + cos(angle)*4.4)
	var walk := create_tween()
	walk.tween_property(world.doctor,"position",Vector3(24,0,22),1.5).set_trans(Tween.TRANS_SINE)
	walk.tween_property(world.doctor,"position",destination,2.0).set_trans(Tween.TRANS_SINE)
	await walk.finished
	assembled += 1
	stone = -1
	stage = mini(assembled,4)
	world.install_stones(assembled)
	_notify("Stone "+str(assembled)+" of 5 installed. Reactor synchronization complete.")
	await get_tree().create_timer(0.6).timeout
	var return_trip := create_tween()
	return_trip.tween_property(world.doctor,"position",start,1.5)
	await return_trip.finished
	busy = false
	_build_actions()
	_save_game()

func _finish_adventure() -> void:
	if assembled != 5:
		return
	ending = _evaluate_ending()
	_notify("MISSION COMPLETE: "+ending.to_upper()+" ending. All five stones installed.")
	_save_game()
	_build_actions()
	_update_hud()

func _toggle_drive() -> void:
	if busy or paused or in_lab:
		return
	if not driving and player.position.distance_to(van.position) > 4.2:
		_notify("Approach the yellow utility vehicle to drive.")
		return
	driving = not driving
	appearance.visible = not driving
	if driving:
		van.position = Vector3(player.position.x,0,player.position.z)
		_notify("Electric vehicle engaged. RUN boosts speed; DRIVE exits.")
	else:
		player.position = van.position + Vector3(2.5,0.12,0)
		_notify("Exited vehicle.")

func _cycle_camera() -> void:
	camera_distance = 4.5 if camera_distance > 6.0 else (0.01 if camera_distance > 1.0 else 7.8)
	_notify("Camera switched.")

func _toggle_pause() -> void:
	if menu_open:
		return
	paused = not paused
	if paused:
		_save_game()
		_notify("PAUSED — press PAUSE again to continue.")
	else:
		_notify("Mission resumed.")

func _show_map() -> void:
	var names := " → ".join(PackedStringArray(STAGES))
	_notify("DISTRICTS: "+names+" | Active: "+STAGES[stage])

func _notify(message: String) -> void:
	toast_label.text = message
	notice_seconds = 4.0

func _physics_process(delta: float) -> void:
	if busy or paused:
		player.velocity = Vector3.ZERO
		return
	var axis := Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		axis.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		axis.x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		axis.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		axis.y += 1.0
	var pad: Vector2 = joystick.direction
	if pad.length_squared() > 0.015:
		axis = pad
	axis = axis.limit_length(1.0)
	var forward := Vector3(-sin(camera_yaw),0,-cos(camera_yaw))
	var right := Vector3(cos(camera_yaw),0,-sin(camera_yaw))
	var move := right * axis.x - forward * axis.y
	var fast := run_held or Input.is_key_pressed(KEY_SHIFT)
	var speed: float = (27.0 if fast else 18.0) if driving else (9.2 if fast else 5.5)
	player.velocity.x = move.x * speed
	player.velocity.z = move.z * speed
	if player.is_on_floor():
		if jump_requested and not driving:
			player.velocity.y = 8.0
		else:
			player.velocity.y = -0.4
	else:
		player.velocity.y -= 24.0 * delta
	jump_requested = false
	var previous: Vector3 = player.position
	player.move_and_slide()
	if world.blocked(player.position,in_lab,stage):
		var trial := player.position
		player.position.x = previous.x
		if world.blocked(player.position,in_lab,stage):
			player.position.z = previous.z
			player.position.x = trial.x
			if world.blocked(player.position,in_lab,stage):
				player.position = Vector3(previous.x,player.position.y,previous.z)
	if move.length_squared() > 0.01:
		var target_angle := atan2(-move.x,-move.z)
		if driving:
			van.rotation.y = lerp_angle(van.rotation.y,target_angle,clampf(delta*8.0,0,1))
		else:
			appearance.rotation.y = lerp_angle(appearance.rotation.y,target_angle,clampf(delta*8.0,0,1))
	if driving:
		van.position = Vector3(player.position.x,0,player.position.z)

func _process(delta: float) -> void:
	anim_clock += delta
	var motion := Vector2(player.velocity.x,player.velocity.z).length()
	var swing := sin(anim_clock * (14.0 if run_held else 9.0)) * 0.48 if motion > 0.7 else 0.0
	left_leg.rotation.x = lerpf(left_leg.rotation.x,swing,clampf(delta*10,0,1))
	right_leg.rotation.x = lerpf(right_leg.rotation.x,-swing,clampf(delta*10,0,1))
	left_arm.rotation.x = -left_leg.rotation.x * 0.7
	right_arm.rotation.x = -right_leg.rotation.x * 0.7
	if stone >= 0:
		appearance.position.y = sin(anim_clock*2.5)*0.025
	else:
		appearance.position.y = 0
	var look := player.position + Vector3(0,1.4,0)
	var camera_height := 0.0 if camera_distance < 1.0 else (2.8 if in_lab else 3.6)
	var wanted := look + Vector3(sin(camera_yaw)*camera_distance,camera_height,cos(camera_yaw)*camera_distance)
	camera.position = camera.position.lerp(wanted,clampf(delta*7.5,0,1))
	camera.look_at(look,Vector3.UP)
	if notice_seconds > 0.0:
		notice_seconds -= delta
		if notice_seconds <= 0.0:
			toast_label.text = ""
	ui_tick += delta
	if ui_tick > 0.2:
		ui_tick = 0.0
		_update_hud()

func _update_hud() -> void:
	if objective_label == null:
		return
	var name := "REACTOR: FINAL ACTIVATION" if assembled == 5 else STAGES[stage].to_upper()
	objective_label.text = name + "  •  %d/5 STONES" % assembled
	if ending != "":
		detail_label.text = "ADVENTURE COMPLETE — " + ending.to_upper() + " ENDING"
	elif stone >= 0:
		detail_label.text = "Carrying stone "+str(stone+1)+". Return to the lab and give it to Dr. Meera."
	elif in_lab:
		detail_label.text = "Underground at 24 m. Reactor and research personnel."
	else:
		detail_label.text = "Follow the beacon. Complete tasks and recover the district stone."
	meters_label.text = ("UNDERGROUND LAB" if in_lab else "SURYANAGAR") + "   |   " + ("DRIVING" if driving else "ON FOOT") + "   |   OFFLINE"
	var a := _nearest()
	if not a.is_empty():
		var dist := _nearest_distance(a)
		var dir: Vector3 = (a.pos - player.position).normalized()
		radar_label.text = a.label+"\n%d m to waypoint" % roundi(dist)
		prompt_label.text = ("ACT  •  " if dist <= 4.0 else "REACH WAYPOINT  •  ") + a.label
	else:
		radar_label.text = "MISSION COMPLETE"
		prompt_label.text = "The future is in your hands."

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_E:
				_do_interaction()
			KEY_F:
				_toggle_drive()
			KEY_C:
				_cycle_camera()
			KEY_SPACE:
				jump_requested = true
			KEY_ESCAPE:
				_toggle_pause()
	if event is InputEventScreenDrag and event.position.x > get_viewport().get_visible_rect().size.x * 0.47 and not menu_open:
		camera_yaw -= event.relative.x * 0.006
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		camera_yaw -= event.relative.x * 0.006

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED:
		_save_game()
