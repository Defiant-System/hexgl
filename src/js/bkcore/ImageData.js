
/*
	Creates a new ImageData object
	@param path string The path of the image
	@param callback function A callback function to be called
		once th eimage is loaded
*/

class ImageData {
	
	constructor(path, callback) {
		this.image = new Image;
		this.pixels = null;
		this.canvas = null;
		this.loaded = false;
		this.image.onload = () => {
			var context;
			this.canvas = document.createElement('canvas');
			this.canvas.width = this.image.width;
			this.canvas.height = this.image.height;
			context = this.canvas.getContext('2d');
			context.drawImage(this.image, 0, 0);
			this.pixels = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
			this.loaded = true;
			context = null;
			this.canvas = null;
			this.image = null;
			return callback != null ? callback.call(this) : void 0;
		};
		this.image.crossOrigin = "anonymous";
		this.image.src = path;
	}

	/*
		Gets pixel RGBA data at given index
		@param x int In pixels
		@param y int In pixels
		@return Object{r,g,b,a}
	*/
	getPixel(x, y) {
		var i;
		if (!(this.pixels != null) || x < 0 || y < 0 || x >= this.pixels.width || y >= this.pixels.height) {
			return {
				r: 0,
				g: 0,
				b: 0,
				a: 0
			};
		}
		i = (y * this.pixels.width + x) * 4;
		return {
			r: this.pixels.data[i],
			g: this.pixels.data[i + 1],
			b: this.pixels.data[i + 2],
			a: this.pixels.data[i + 3]
		};
	}

	/*
		Gets pixel RGBA data at given float index using bilinear interpolation
		@param x float In subpixels
		@param y float In subpixels
		@return Object{r,g,b,a}
	*/
	getPixelBilinear(fx, fy) {
		let x = Math.floor(fx),
			y = Math.floor(fy),
			rx = fx - x - .5,
			ry = fy - y - .5,
			ax = Math.abs(rx),
			ay = Math.abs(ry),
			dx = rx < 0 ? -1 : 1,
			dy = ry < 0 ? -1 : 1,
			c = this.getPixel(x, y),
			cx = this.getPixel(x + dx, y),
			cy = this.getPixel(x, y + dy),
			cxy = this.getPixel(x + dx, y + dy),
			cf1 = [(1 - ax) * c.r + ax * cx.r, (1 - ax) * c.g + ax * cx.g, (1 - ax) * c.b + ax * cx.b, (1 - ax) * c.a + ax * cx.a],
			cf2 = [(1 - ax) * cy.r + ax * cxy.r, (1 - ax) * cy.g + ax * cxy.g, (1 - ax) * cy.b + ax * cxy.b, (1 - ax) * cy.a + ax * cxy.a];
		return {
			r: (1 - ay) * cf1[0] + ay * cf2[0],
			g: (1 - ay) * cf1[1] + ay * cf2[1],
			b: (1 - ay) * cf1[2] + ay * cf2[2],
			a: (1 - ay) * cf1[3] + ay * cf2[3]
		};
	}

	/*
		Gets pixel data at given index
		as 3-bytes integer (for floating-point textures erzats, from RGB values)
		@param x int In pixels
		@param y int In pixels
		@return int (R + G*255 + B*255*255)
	*/
	getPixelF(x, y) {
		var c = this.getPixel(x, y);
		return c.r + c.g * 255 + c.b * 255 * 255;
	}

	/*
		Gets pixel data at given float index using bilinear interpolationas
		as 3-bytes integer (for floating-point textures erzats, from RGB values)
		@param x float In subpixels
		@param y float In subpixels
		@return Object{r,g,b,a}
	*/
	getPixelFBilinear(fx, fy) {
		var c = this.getPixelBilinear(fx, fy);
		return c.r + c.g * 255 + c.b * 255 * 255;
	}

}
