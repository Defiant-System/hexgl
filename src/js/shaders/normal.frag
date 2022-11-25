
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform float uOpacity;
uniform bool enableDiffuse;
uniform bool enableSpecular;
uniform bool enableAO;
uniform bool enableReflection;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tSpecular;
uniform sampler2D tAO;
uniform samplerCube tCube;
uniform float uNormalScale;
uniform float uReflectivity;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vNormal;
varying vec2 vUv;
uniform vec3 ambientLightColor;

#if MAX_DIR_LIGHTS > 0
	uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];
	uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];
#endif

#if MAX_POINT_LIGHTS > 0
	uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];
	uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];
	uniform float pointLightDistance[ MAX_POINT_LIGHTS ];
#endif

#ifdef WRAP_AROUND
	uniform vec3 wrapRGB;
#endif

varying vec3 vViewPosition;

#ifdef USE_SHADOWMAP
	uniform sampler2D shadowMap[ MAX_SHADOWS ];
	uniform vec2 shadowMapSize[ MAX_SHADOWS ];
	uniform float shadowDarkness[ MAX_SHADOWS ];
	uniform float shadowBias[ MAX_SHADOWS ];
	varying vec4 vShadowCoord[ MAX_SHADOWS ];
	float unpackDepth( const in vec4 rgba_depth ) {
		const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
		float depth = dot( rgba_depth, bit_shift );
		return depth;
	}
#endif

#ifdef USE_FOG
	uniform vec3 fogColor;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif

void main() {
	gl_FragColor = vec4( vec3( 1.0 ), uOpacity );
	vec3 specularTex = vec3( 1.0 );
	vec3 normalTex = texture2D( tNormal, vUv ).xyz * 2.0 - 1.0;
	normalTex.xy *= uNormalScale;
	normalTex = normalize( normalTex );
	
	if( enableDiffuse ) {
		#ifdef GAMMA_INPUT
			vec4 texelColor = texture2D( tDiffuse, vUv );
			texelColor.xyz *= texelColor.xyz;
			gl_FragColor = gl_FragColor * texelColor;
		#else
			gl_FragColor = gl_FragColor * texture2D( tDiffuse, vUv );
		#endif
	}

	if( enableAO ) {
		#ifdef GAMMA_INPUT
			vec4 aoColor = texture2D( tAO, vUv );
			aoColor.xyz *= aoColor.xyz;
			gl_FragColor.xyz = gl_FragColor.xyz * aoColor.xyz;
		#else
			gl_FragColor.xyz = gl_FragColor.xyz * texture2D( tAO, vUv ).xyz;
		#endif
	}

	if( enableSpecular )
		specularTex = texture2D( tSpecular, vUv ).xyz;
	
	mat3 tsb = mat3( normalize( vTangent ), normalize( vBinormal ), normalize( vNormal ) );
	vec3 finalNormal = tsb * normalTex;
	vec3 normal = normalize( finalNormal );
	vec3 viewPosition = normalize( vViewPosition );

	#ifdef DOUBLE_SIDED
		normal = normal * ( -1.0 + 2.0 * float( gl_FrontFacing ) );
	#endif

	#if MAX_POINT_LIGHTS > 0
		vec3 pointDiffuse = vec3( 0.0 );
		vec3 pointSpecular = vec3( 0.0 );
		
		for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {
			vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );
			vec3 pointVector = lPosition.xyz + vViewPosition.xyz;
			float pointDistance = 1.0;
		
			if ( pointLightDistance[ i ] > 0.0 )
				pointDistance = 1.0 - min( ( length( pointVector ) / pointLightDistance[ i ] ), 1.0 );
			pointVector = normalize( pointVector );

			#ifdef WRAP_AROUND
				float pointDiffuseWeightFull = max( dot( normal, pointVector ), 0.0 );
				float pointDiffuseWeightHalf = max( 0.5 * dot( normal, pointVector ) + 0.5, 0.0 );
				vec3 pointDiffuseWeight = mix( vec3 ( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );
			#else
				float pointDiffuseWeight = max( dot( normal, pointVector ), 0.0 );
			#endif

			pointDiffuse += pointDistance * pointLightColor[ i ] * uDiffuseColor * pointDiffuseWeight;
			vec3 pointHalfVector = normalize( pointVector + viewPosition );
			float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );
			float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, uShininess ), 0.0 );

			#ifdef PHYSICALLY_BASED_SHADING
				float specularNormalization = ( uShininess + 2.0001 ) / 8.0;
				vec3 schlick = specularTex + vec3( 1.0 - specularTex ) * pow( 1.0 - dot( pointVector, pointHalfVector ), 5.0 );
				pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * pointDistance * specularNormalization;
			#else
				pointSpecular += pointDistance * pointLightColor[ i ] * specularTex * pointSpecularWeight * pointDiffuseWeight;
			#endif
		}
	#endif

	#if MAX_DIR_LIGHTS > 0
		vec3 dirDiffuse = vec3( 0.0 );
		vec3 dirSpecular = vec3( 0.0 );
		for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {
			vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );
			vec3 dirVector = normalize( lDirection.xyz );
			
			#ifdef WRAP_AROUND
				float directionalLightWeightingFull = max( dot( normal, dirVector ), 0.0 );
				float directionalLightWeightingHalf = max( 0.5 * dot( normal, dirVector ) + 0.5, 0.0 );
				vec3 dirDiffuseWeight = mix( vec3( directionalLightWeightingFull ), vec3( directionalLightWeightingHalf ), wrapRGB );
			#else
				float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );
			#endif

			dirDiffuse += directionalLightColor[ i ] * uDiffuseColor * dirDiffuseWeight;
			vec3 dirHalfVector = normalize( dirVector + viewPosition );
			float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );
			float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, uShininess ), 0.0 );

			#ifdef PHYSICALLY_BASED_SHADING
				float specularNormalization = ( uShininess + 2.0001 ) / 8.0;
				vec3 schlick = specularTex + vec3( 1.0 - specularTex ) * pow( 1.0 - dot( dirVector, dirHalfVector ), 5.0 );
				dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;
			#else
				dirSpecular += directionalLightColor[ i ] * specularTex * dirSpecularWeight * dirDiffuseWeight;
			#endif
		}
	#endif

	vec3 totalDiffuse = vec3( 0.0 );
	vec3 totalSpecular = vec3( 0.0 );

	#if MAX_DIR_LIGHTS > 0
		totalDiffuse += dirDiffuse;
		totalSpecular += dirSpecular;
	#endif

	#if MAX_POINT_LIGHTS > 0
		totalDiffuse += pointDiffuse;
		totalSpecular += pointSpecular;
	#endif

	gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * uAmbientColor) + totalSpecular;
	
	if ( enableReflection ) {
		#ifdef DOUBLE_SIDED
			float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
		#else
			float flipNormal = 1.0;
		#endif

		vec3 wPos = cameraPosition - vViewPosition;
		vec3 vReflect = reflect( normalize( wPos ), normal );
		vec4 cubeColor = textureCube( tCube, flipNormal*vec3( -vReflect.x, vReflect.yz ) );

		#ifdef GAMMA_INPUT
			cubeColor.xyz *= cubeColor.xyz;
		#endif

		gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, specularTex.r * uReflectivity );
	}

	#ifdef USE_SHADOWMAP
		#ifdef SHADOWMAP_DEBUG
			vec3 frustumColors[3];
			frustumColors[0] = vec3( 1.0, 0.5, 0.0 );
			frustumColors[1] = vec3( 0.0, 1.0, 0.8 );
			frustumColors[2] = vec3( 0.0, 0.5, 1.0 );
		#endif

		#ifdef SHADOWMAP_CASCADE
			int inFrustumCount = 0;
		#endif

		float fDepth;
		vec3 shadowColor = vec3( 1.0 );

		for( int i = 0; i < MAX_SHADOWS; i ++ ) {
			vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;
			bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
			bool inFrustum = all( inFrustumVec );

			#ifdef SHADOWMAP_CASCADE
				inFrustumCount += int( inFrustum );
				bvec3 frustumTestVec = bvec3( inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0 );
			#else
				bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
			#endif

			bool frustumTest = all( frustumTestVec );

			if ( frustumTest ) {
				shadowCoord.z += shadowBias[ i ];
				
				#ifdef SHADOWMAP_SOFT
					float shadow = 0.0;
					const float shadowDelta = 1.0 / 9.0;
					float xPixelOffset = 1.0 / shadowMapSize[ i ].x;
					float yPixelOffset = 1.0 / shadowMapSize[ i ].y;
					float dx0 = -1.25 * xPixelOffset;
					float dy0 = -1.25 * yPixelOffset;
					float dx1 = 1.25 * xPixelOffset;
					float dy1 = 1.25 * yPixelOffset;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );
					if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
					shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );
				#else
					vec4 rgbaDepth = texture2D( shadowMap[ i ], shadowCoord.xy );
					float fDepth = unpackDepth( rgbaDepth );
					
					if ( fDepth < shadowCoord.z )
						shadowColor = shadowColor * vec3( 1.0 - shadowDarkness[ i ] );
				#endif
			}
			#ifdef SHADOWMAP_DEBUG
				#ifdef SHADOWMAP_CASCADE
					if ( inFrustum && inFrustumCount == 1 ) gl_FragColor.xyz *= frustumColors[ i ];
				#else
					if ( inFrustum ) gl_FragColor.xyz *= frustumColors[ i ];
				#endif
			#endif
		}

		#ifdef GAMMA_OUTPUT
			shadowColor *= shadowColor;
		#endif
			gl_FragColor.xyz = gl_FragColor.xyz * shadowColor;
		#endif

		#ifdef GAMMA_OUTPUT
			gl_FragColor.xyz = sqrt( gl_FragColor.xyz );
		#endif

		#ifdef USE_FOG
			float depth = gl_FragCoord.z / gl_FragCoord.w;
			
			#ifdef FOG_EXP2
				const float LOG2 = 1.442695;
				float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
				fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
			#else
				float fogFactor = smoothstep( fogNear, fogFar, depth );
			#endif
		gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
	#endif
}
