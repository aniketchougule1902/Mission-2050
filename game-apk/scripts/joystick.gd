extends Control

var direction: Vector2 = Vector2.ZERO
var finger: int = -1
var mouse_held := false
const MAX_RADIUS := 77.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	queue_redraw()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and finger < 0:
			finger = event.index
			_read_at(event.position)
			accept_event()
		elif not event.pressed and event.index == finger:
			finger = -1
			direction = Vector2.ZERO
			queue_redraw()
			accept_event()
	elif event is InputEventScreenDrag and event.index == finger:
		_read_at(event.position)
		accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		mouse_held = event.pressed
		if mouse_held:
			_read_at(event.position)
		else:
			direction = Vector2.ZERO
			queue_redraw()
		accept_event()
	elif event is InputEventMouseMotion and mouse_held:
		_read_at(event.position)
		accept_event()

func _read_at(pos: Vector2) -> void:
	var center: Vector2 = size * 0.5
	var delta: Vector2 = pos - center
	direction = delta.limit_length(MAX_RADIUS) / MAX_RADIUS
	queue_redraw()

func _draw() -> void:
	var center: Vector2 = size * 0.5
	draw_circle(center, 92.0, Color(0.06, 0.13, 0.18, 0.40))
	draw_arc(center, 88.0, 0.0, TAU, 52, Color(0.55, 0.87, 0.87, 0.65), 3.0, true)
	draw_circle(center + direction * MAX_RADIUS, 38.0, Color(0.19, 0.78, 0.80, 0.78))
	draw_circle(center + direction * MAX_RADIUS, 29.0, Color(0.61, 0.94, 0.93, 0.50))
