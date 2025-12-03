document.addEventListener('DOMContentLoaded', () => {

    // --- Interactive Background Light Logic ---
    const lights = document.querySelectorAll('.light');

    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Calculate mouse position relative to center
        const mouseX = (clientX - centerX) / centerX; 
        const mouseY = (clientY - centerY) / centerY;

        // Move lights based on mouse, with different speeds for parallax
        if (lights[0]) {
            lights[0].style.transform = `translate(${mouseX * -150}px, ${mouseY * -90}px)`;
        }
        if (lights[1]) {
            lights[1].style.transform = `translate(${mouseX * 60}px, ${mouseY * 120}px)`;
        }
        if (lights[2]) {
            lights[2].style.transform = `translate(${mouseX * 60}px, ${mouseY * -60}px)`;
        }
    });
});

