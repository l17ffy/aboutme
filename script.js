// Универсальная логика для ЛЮБОГО количества окон .window
document.querySelectorAll('.window').forEach((win) => {
    const titleBar = win.querySelector('.title-bar');
    const windowBody = win.querySelector('.window-body');
    const btnMin = win.querySelector('.btn-min');
    const btnMax = win.querySelector('.btn-max');
    const btnClose = win.querySelector('.btn-close');

    let isMaximized = false;
    let isDragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let animationFrameId = null;

    // При клике на окно — поднимаем его наверх (z-index)
    win.addEventListener('mousedown', () => {
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = 1);
        win.style.zIndex = 2;
    });

    titleBar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || isMaximized) return;
        if (window.innerWidth <= 768) return; // на телефоні вікна статичні, драг не потрібен

        isDragging = true;
        document.body.classList.add('is-dragging');

        startX = e.clientX;
        startY = e.clientY;

        const rect = win.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        animationFrameId = requestAnimationFrame(() => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            win.style.left = `${startLeft + deltaX}px`;
            win.style.top = `${startTop + deltaY}px`;
        });
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.classList.remove('is-dragging');

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });

    btnMin.addEventListener('click', () => windowBody.classList.toggle('hidden'));

    btnMax.addEventListener('click', () => {
        isMaximized = !isMaximized;
        win.classList.toggle('maximized');
    });

    btnClose.addEventListener('click', () => win.style.display = 'none');
});
