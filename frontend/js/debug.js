/**
 * Debug helper for CloudBleed demonstration
 */

(function() {
  function checkForOverlappingElements() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
      const rect = button.getBoundingClientRect();
      console.log(`Tab button "${button.textContent.trim()}" position:`, rect);
      
      const originalBackground = button.style.backgroundColor;
      button.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      setTimeout(() => {
        button.style.backgroundColor = originalBackground;
      }, 2000);
      
      const elementsAtPoint = document.elementsFromPoint(
        rect.left + rect.width/2, 
        rect.top + rect.height/2
      );
      
      console.log(`Elements at position of "${button.textContent.trim()}":`, 
        elementsAtPoint.map(el => `${el.tagName.toLowerCase()}${el.id ? '#'+el.id : ''}${el.className ? '.'+el.className.replace(/\s+/g, '.') : ''}`).join(', ')
      );
      
      button.addEventListener('click', function(e) {
        console.log(`Button "${this.textContent.trim()}" clicked!`, e);
      });
    });
  }
  
  window.addEventListener('load', function() {
    console.log("Debug script loaded - checking tab functionality");
    setTimeout(checkForOverlappingElements, 1000);
    
    document.addEventListener('click', function(e) {
      console.log('Document click at:', e.clientX, e.clientY, 'Target:', e.target);
    });
  });
})();
