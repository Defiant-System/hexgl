
let Utils = {
	createNormalMaterial(opt={}) {
		let opts = {
				ambient: 0x444444,
				normalScale: 1.0,
				reflectivity: 0.9,
				shininess: 42,
				metal: false,
				...opt,
			};
		var material,
			parameters,
			shadername = opts.perPixel ? "normalV" : "normal",
			shader = Shaders[shadername],
			uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		
		uniforms["enableDiffuse"].value = true;
		uniforms["enableSpecular"].value = true;
		uniforms["enableReflection"].value = !!opts.cube;
		uniforms["tNormal"].texture = opts.normal;
		uniforms["tDiffuse"].texture = opts.diffuse;
		uniforms["tSpecular"].texture = opts.specular;
		uniforms["uAmbientColor"].value.setHex(opts.ambient);
		uniforms["uAmbientColor"].value.convertGammaToLinear();
		uniforms["uNormalScale"].value = opts.normalScale;

		if (opts.cube != null) {
			uniforms["tCube"].texture = opts.cube;
			uniforms["uReflectivity"].value = opts.reflectivity;
		}
		parameters = {
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: uniforms,
			lights: true,
			fog: false
		};
		material = new THREE.ShaderMaterial(parameters);
		material.perPixel = true;
		material.metal = opts.metal;

		return material;
	}
};
