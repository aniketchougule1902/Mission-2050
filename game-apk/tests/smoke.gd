extends SceneTree
# Headless native-game smoke test: parses all scripts and exercises native nodes/tweens.
func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, explanation: String) -> bool:
	if condition:
		return true
	push_error("NATIVE GAME SMOKE FAILED: " + explanation)
	quit(1)
	return false

func _run() -> void:
	var packed: PackedScene = load("res://scenes/main.tscn")
	if not _check(packed != null,"Main scene must load"):
		return
	var game := packed.instantiate()
	root.add_child(game)
	await process_frame
	var world = game.get("world")
	if not _check(world != null,"World must initialize"):
		return
	if not _check(world.city != null and world.lab != null and world.reactor != null,
			"Both levels and the reactor must render"):
		return
	if not _check(world.garden_plots.size() == 4,"Four restoration gardens must exist"):
		return
	if not _check(world.cars.size() == 8,"Street vehicles must initialize"):
		return
	if not _check(game.get("actions").size() >= 1,"Initial playable objective is required"):
		return
	var first_action: Dictionary = game.get("actions")[0]
	if not _check(first_action.id == "fuse" or first_action.id == "lift",
			"Save restoration must yield a playable first objective"):
		return
	var tree: Node3D = world.garden_trees["housing1"]
	if not _check(tree != null,"Native sapling mesh must load"):
		return
	var planted: bool = await world.play_ecology("housing1",game.get("right_arm"))
	if not _check(planted and tree.scale.x > 0.99,"Planting tween must complete and grow the tree"):
		return
	world.restore_gardens({"housing1":true,"water1":true})
	if not _check(tree.scale.x >= 1.0 and world.garden_trees["water1"].scale.x > 1.4,
			"Restored planted and watered trees must render at saved growth"):
		return
	var watered: bool = await world.play_ecology("water2",game.get("right_arm"))
	if not _check(watered and world.garden_trees["water2"].scale.x >= 1.44,
			"Water droplets and growth tween must complete"):
		return
	game._new_game()
	if not _check(game.get("assembled") == 0 and game.get("stage") == 0 and game.get("stone") == -1,
			"New Adventure must reset missions"):
		return
	if not _check(world.garden_trees["housing1"].scale.x < 0.01,
			"New Adventure must clear persistent gardens"):
		return
	print("Native Mission 2050: scene, missions, vehicles, gardening and reset PASS")
	game.queue_free()
	await process_frame
	quit(0)
