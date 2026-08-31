// Shared driver for the brand gradient's continuous hover motion, used by
// both Button's rotating border and TextLink's sliding underline.
//
// A CSS @keyframes/@property animation on the moving custom property was
// tried first (see git history on Button.astro) and dropped: browsers don't
// reliably repaint a registered custom property interpolated by a CSS
// animation every frame, so the motion stuttered. Writing the property from
// JS on a rAF loop is a plain style mutation each frame, which always
// repaints, so it's the more robust option here — not a preference for JS
// over CSS in general.
//
// Each call to bindHoverGradientMotion owns one closure (value/rafId/
// lastTime) per element, so hovering several instances at once animates them
// independently. The value is never reset on pointerleave — only the rAF
// loop is cancelled — so re-entering hover resumes from exactly where it
// stopped.

export interface GradientMotionOptions {
	/** CSS custom property written every frame, e.g. '--border-angle'. */
	property: string;
	/** Unit appended to the numeric value, e.g. 'deg' or 'px'. */
	unit: string;
	/** Progress per second, in the same unit. */
	speed: number;
	/** Value at which progress wraps back to 0 (must be a seamless loop point). */
	wrapAt: number;
	/** Value assumed before any hover has taken place; must match the CSS default. */
	initialValue: number;
	/** Returns true while the element must not animate (e.g. disabled). */
	isDisabled?: (el: HTMLElement) => boolean;
}

export function bindHoverGradientMotion(el: HTMLElement, options: GradientMotionOptions): void {
	const { property, unit, speed, wrapAt, initialValue, isDisabled = () => false } = options;

	let value = initialValue;
	let rafId: number | null = null;
	let lastTime: number | null = null;

	const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	const tick = (time: number) => {
		if (isDisabled(el) || !el.isConnected) {
			rafId = null;
			lastTime = null;
			return;
		}
		if (lastTime !== null) {
			value = (value + ((time - lastTime) / 1000) * speed) % wrapAt;
			el.style.setProperty(property, `${value}${unit}`);
		}
		lastTime = time;
		rafId = requestAnimationFrame(tick);
	};

	const start = () => {
		if (rafId !== null || isDisabled(el) || prefersReducedMotion()) return;
		const current = parseFloat(el.style.getPropertyValue(property));
		if (Number.isFinite(current)) value = current;
		lastTime = null;
		rafId = requestAnimationFrame(tick);
	};

	const stop = () => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		lastTime = null;
	};

	el.addEventListener('pointerenter', start);
	el.addEventListener('pointerleave', stop);
}

/** Shared disabled check for the button/link markup pattern used across this UI kit:
 *  a native `disabled` attribute on `<button>`, or `aria-disabled="true"` on `<a>`. */
export function isInteractiveDisabled(el: HTMLElement): boolean {
	return (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true';
}
