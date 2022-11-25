
let Shaders = {
	additive: {
		vertexShader: `@import "../../shaders/additive.vert"`,
		fragmentShader: `@import "../../shaders/additive.frag"`,
		uniforms: {
			tDiffuse: { type: "t", value: 0, texture: null },
			tAdd: { type: "t", value: 1, texture: null },
			fCoeff: { type: "f", value: 1.0 }
		},
	},

	/* ------------------------------------------------------------------------------------------------
	//	Hexagonal Vignette shader
	//  by BKcore.com
	 ------------------------------------------------------------------------------------------------ */
	hexvignette: {
		vertexShader: `@import "../../shaders/hexvignette.vert"`,
		fragmentShader: `@import "../../shaders/hexvignette.frag"`,
		uniforms: {
			tDiffuse: { type: "t", value: 0, texture: null },
			tHex: {type: "t", value: 1, texture: null},
			size: {type: "f", value: 512.0},
			rx: {type: "f", value: 1024.0},
			ry: {type: "f", value: 768.0},
			color: {type: "c", value: new THREE.Color(0x458ab1)}
		},
	},

	/* -------------------------------------------------------------------------
	//	Normal map shader (perpixel)
	//		- Blinn-Phong
	//		- normal + diffuse + specular + AO + displacement + reflection + shadow maps
	//		- PER-PIXEL point and directional lights (use with "lights: true" material option)
	//		- modified by BKcore
	 ------------------------------------------------------------------------- */
	normal: {
		vertexShader: `@import "../../shaders/normal.vert"`,
		fragmentShader: `@import "../../shaders/normal.frag"`,
		uniforms: THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "lights" ],
			THREE.UniformsLib[ "shadowmap" ],
			{
				"enableAO"		  : { type: "i", value: 0 },
				"enableDiffuse"	  : { type: "i", value: 0 },
				"enableSpecular"  : { type: "i", value: 0 },
				"enableReflection": { type: "i", value: 0 },

				"tDiffuse"	   : { type: "t", value: 0, texture: null },
				"tCube"		   : { type: "t", value: 1, texture: null },
				"tNormal"	   : { type: "t", value: 2, texture: null },
				"tSpecular"	   : { type: "t", value: 3, texture: null },
				"tAO"		   : { type: "t", value: 4, texture: null },
				"tDisplacement": { type: "t", value: 5, texture: null },

				"uNormalScale": { type: "f", value: 1.0 },
				"uDisplacementBias": { type: "f", value: 0.0 },
				"uDisplacementScale": { type: "f", value: 1.0 },

				"uDiffuseColor": { type: "c", value: new THREE.Color( 0xffffff ) },
				"uSpecularColor": { type: "c", value: new THREE.Color( 0x111111 ) },
				"uAmbientColor": { type: "c", value: new THREE.Color( 0xffffff ) },
				"uShininess": { type: "f", value: 30 },
				"uOpacity": { type: "f", value: 1 },

				"uReflectivity": { type: "f", value: 0.5 },
				"uOffset" : { type: "v2", value: new THREE.Vector2( 0, 0 ) },
				"uRepeat" : { type: "v2", value: new THREE.Vector2( 1, 1 ) },
				"wrapRGB"  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) }
			}
		]),
	},

	/* -------------------------------------------------------------------------
		//	Normal map shader
		//		- Blinn-Phong
		//		- normal + diffuse + specular + AO + displacement + reflection + shadow maps
		//		- PER-VERTEX point and directional lights (use with "lights: true" material option)
		 ------------------------------------------------------------------------- */
	normalV : {
		vertexShader: `@import "../../shaders/normalV.vert"`,
		fragmentShader: `@import "../../shaders/normalV.frag"`,
		uniforms: THREE.UniformsUtils.merge( [
			THREE.UniformsLib[ "fog" ],
			THREE.UniformsLib[ "lights" ],
			THREE.UniformsLib[ "shadowmap" ],
			{
				"enableAO"		  : { type: "i", value: 0 },
				"enableDiffuse"	  : { type: "i", value: 0 },
				"enableSpecular"  : { type: "i", value: 0 },
				"enableReflection": { type: "i", value: 0 },

				"tDiffuse"	   : { type: "t", value: 0, texture: null },
				"tCube"		   : { type: "t", value: 1, texture: null },
				"tNormal"	   : { type: "t", value: 2, texture: null },
				"tSpecular"	   : { type: "t", value: 3, texture: null },
				"tAO"		   : { type: "t", value: 4, texture: null },
				"tDisplacement": { type: "t", value: 5, texture: null },

				"uNormalScale": { type: "f", value: 1.0 },
				"uDisplacementBias": { type: "f", value: 0.0 },
				"uDisplacementScale": { type: "f", value: 1.0 },

				"uDiffuseColor": { type: "c", value: new THREE.Color( 0xffffff ) },
				"uSpecularColor": { type: "c", value: new THREE.Color( 0x111111 ) },
				"uAmbientColor": { type: "c", value: new THREE.Color( 0xffffff ) },
				"uShininess": { type: "f", value: 30 },
				"uOpacity": { type: "f", value: 1 },

				"uReflectivity": { type: "f", value: 0.5 },
				"uOffset" : { type: "v2", value: new THREE.Vector2( 0, 0 ) },
				"uRepeat" : { type: "v2", value: new THREE.Vector2( 1, 1 ) },
				"wrapRGB"  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) }
			}
		]),
	},

	/* -------------------------------------------------------------------------
	//	Cube map shader
	 ------------------------------------------------------------------------- */
	cube: {
		vertexShader: `@import "../../shaders/cube.vert"`,
		fragmentShader: `@import "../../shaders/cube.frag"`,
		uniforms: {
			"tCube": { type: "t", value: 1, texture: null },
			"tFlip": { type: "f", value: -1 }
		},
	}
};
