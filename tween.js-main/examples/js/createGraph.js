// @ts-check
import {Tween, Easing} from '../../dist/tween.esm.js'
import {toPhysicalPx} from './toPhysicalPx.js'

export function createGraph(group, text, easingFn, width = 180, height = 100) {
	const div = document.createElement('div')
	div.style.display = 'inline-block'
	// +20 for padding
	div.style.width = width + 20 + 'px'
	div.style.height = height + 20 + 'px'

	const canvas = document.createElement('canvas')
	canvas.style.width = width + 'px'
	canvas.style.height = height + 'px'
	canvas.width = toPhysicalPx(width)
	canvas.height = toPhysicalPx(height)

	const context = canvas.getContext('2d')
	if (!context) throw 'impossible'

	context.fillStyle = 'rgb(250,250,250)'
	context.fillRect(0, 0, toPhysicalPx(width), toPhysicalPx(height))

	context.lineWidth = toPhysicalPx(1)
	context.strokeStyle = 'rgb(230,230,230)'

	context.beginPath()
	context.moveTo(0, toPhysicalPx(20))
	context.lineTo(toPhysicalPx(width), toPhysicalPx(20))
	context.moveTo(0, toPhysicalPx(80))
	context.lineTo(toPhysicalPx(width), toPhysicalPx(80))
	context.closePath()
	context.stroke()

	context.lineWidth = toPhysicalPx(2)
	context.strokeStyle = 'rgba(255,127,127,0.9)'
	context.beginPath()
	context.moveTo(toPhysicalPx(5), toPhysicalPx(80))
	context.lineCap = 'round'

	const position = {x: toPhysicalPx(5), y: toPhysicalPx(80)}

	new Tween(position, group)
		.to({x: toPhysicalPx(175)}, 2000)
		.easing(Easing.Linear.None)
		.start()

	new Tween(position, group)
		.to({y: toPhysicalPx(20)}, 2000)
		.easing(easingFn)
		.onUpdate(function () {
			context.lineTo(position.x, position.y)
			context.stroke()
		})
		.start()

	div.appendChild(document.createTextNode(text))
	div.appendChild(document.createElement('br'))
	div.appendChild(canvas)

	return div
}
