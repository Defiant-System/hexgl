
uniform float size;
uniform float rx;
uniform float ry;
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform sampler2D tHex;
varying vec2 vUv;

void main() {
	vec4 vcolor = vec4(color,1.0);
	vec2 hexuv;
	hexuv.x = mod(vUv.x * rx, size) / size;
	hexuv.y = mod(vUv.y * ry, size) / size;
	vec4 hex = texture2D( tHex, hexuv );

	float tolerance = 0.2;
		float vignette_size = 0.6;
	vec2 powers = pow(abs(vec2(vUv.x - 0.5,vUv.y - 0.5)),vec2(2.0));
	float radiusSqrd = vignette_size*vignette_size;
	float gradient = smoothstep(radiusSqrd-tolerance, radiusSqrd+tolerance, powers.x+powers.y);

	vec2 uv = ( vUv - vec2( 0.5 ) );
	vec2 sample = uv * gradient * 0.5 * (1.0-hex.r);
	vec4 texel = texture2D( tDiffuse, vUv-sample );
	gl_FragColor = (((1.0-hex.r)*vcolor) * 0.5 * gradient) + vec4( mix( texel.rgb, vcolor.xyz*0.7, dot( uv, uv ) ), texel.a );

}
