// Rewards data with your custom rewards
const REWARDS_DATA = [
    {
        day: 1,
        title: "Specialty Snack & Drink Date",
        description: "Coupon for one specialty snack and one specialty drink from one of our favorite stores. We'll enjoy them and do a big catch up, go through notes from Germany, the whole hiking trip, talk about how we've been feeling, things we might wanna change, and what we want to focus on for the next couple months.",
        icon: "🍰",
        rarity: "rare"
    },
    {
        day: 2,
        title: "Game Night Together",
        description: "Play some games! Maybe the escape room game, maybe some board games, card games, or a pokemon game? We could even play several games or try something new!",
        icon: "🎮",
        rarity: "rare"
    },
    {
        day: 3,
        title: "Lunch Date",
        description: "Bee will pick up any food or tasty treat we want on the way home from work. Then as long as the weather is okay, we sit outside on the patio and eat lunch together. Or I can come home and pick you up and we go to lunch together somewhere.",
        icon: "🥙",
        rarity: "rare"
    },
    {
        day: 4,
        title: "Art Project Together",
        description: "Let's make an art project together while reflecting on this last phase of life and what we've been through and what we want for the future. Maybe make art pieces where we pass them back and forth or just do some kind of creative and interpretive reflection on life and setting intentions for the future.",
        icon: "🎨",
        rarity: "epic"
    },
    {
        day: 5,
        title: "Memory Jar Filling",
        description: "Fill out our memory jar! Now that we've gone through all of our notes and spent some time reflecting, let's put all of our favorite memories in our memories jar.",
        icon: "💭",
        rarity: "legendary"
    },
    {
        day: 6,
        title: "Big Sushi Order!",
        description: "A delicious big sushi order just for us to enjoy together! A huge congratulations for such an amazing achievement! Everyone is so proud of you and it's time to celebrate by getting a huge sushi order",
        icon: "🍣",
        rarity: "epic"
    },
    {
        day: 7,
        title: "Full Body Massage",
        description: "A minimum 1 hour full body massage either today or redeemable at any time of your choosing.",
        icon: "💆‍♀️",
        rarity: "legendary"
    }
];

// Game state
let gameState = {
    claimedRewards: [],
    currentDay: 1,
    startDate: new Date('2025-09-01T00:00:00-06:00') // September 1st, 2025, Denver time
};

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('loginRewardsState');
    if (saved) {
        const parsedState = JSON.parse(saved);
        gameState = { ...gameState, ...parsedState };
        gameState.startDate = new Date(gameState.startDate);
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('loginRewardsState', JSON.stringify(gameState));
}

// Get current day based on Denver timezone
function getCurrentDay() {
    const now = new Date();
    const denver = new Date(now.toLocaleString("en-US", {timeZone: "America/Denver"}));
    const denverTime = new Date(denver.getTime());
    
    // Calculate days since start date
    const timeDiff = denverTime.getTime() - gameState.startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Return day (1-7) or 0 if before start date
    if (daysDiff < 0) return 0;
    if (daysDiff >= 7) return 7;
    return daysDiff + 1;
}

// Check if a reward is available
function isRewardAvailable(day) {
    const currentDay = getCurrentDay();
    return day <= currentDay && !gameState.claimedRewards.includes(day);
}

// Check if a reward is claimed
function isRewardClaimed(day) {
    return gameState.claimedRewards.includes(day);
}

// Create reward card element
function createRewardCard(reward) {
    const card = document.createElement('div');
    card.className = 'reward-card';
    card.dataset.day = reward.day;
    
    const isAvailable = isRewardAvailable(reward.day);
    const isClaimed = isRewardClaimed(reward.day);
    
    if (isClaimed) {
        card.classList.add('claimed');
    } else if (isAvailable) {
        card.classList.add('available');
    } else {
        card.classList.add('locked');
    }
    
    let displayIcon, displayName;
    
    if (isClaimed) {
        // Show actual reward for claimed cards
        const shortTitle = reward.title.length > 20 ? reward.title.substring(0, 17) + '...' : reward.title;
        displayIcon = reward.icon;
        displayName = shortTitle;
    } else {
        // Show mystery content for locked/available cards
        displayIcon = '❓';
        displayName = '????';
    }
    
    card.innerHTML = `
        <div class="reward-content">
            <div class="reward-day">Day ${reward.day}</div>
            <div class="reward-icon">${displayIcon}</div>
            <div class="reward-name">${displayName}</div>
        </div>
    `;
    
    if (isAvailable) {
        card.addEventListener('click', () => openUnboxingModal(reward));
    } else if (isClaimed) {
        card.addEventListener('click', () => openViewModal(reward));
    }
    
    return card;
}

// Render rewards grid
function renderRewards() {
    const grid = document.getElementById('rewards-grid');
    grid.innerHTML = '';
    
    REWARDS_DATA.forEach(reward => {
        const card = createRewardCard(reward);
        grid.appendChild(card);
    });
}

// Open unboxing modal
function openUnboxingModal(reward) {
    const modal = document.getElementById('modal-overlay');
    const rewardBox = document.getElementById('reward-box');
    const holdInstruction = document.querySelector('.hold-instruction');
    const rewardReveal = document.getElementById('reward-reveal');
    
    // Reset modal state
    modal.classList.add('active');
    holdInstruction.style.display = 'block';
    rewardReveal.style.display = 'none';
    rewardReveal.classList.remove('active');
    rewardBox.classList.remove('unboxing', 'burst', 'progress-active');
    
    let holdProgress = 0;
    let holdInterval;
    let isHolding = false;
    const holdDuration = 5000; // 5 seconds
    
    // Get the progress outline element
    const progressOutline = document.getElementById('progress-outline');
    
    // Touch/Mouse event handlers
    function startHold() {
        isHolding = true;
        rewardBox.classList.add('unboxing', 'progress-active');
        
        // Add glowing effect to the reward card too
        const rewardCard = document.querySelector(`[data-day="${reward.day}"]`);
        if (rewardCard) {
            rewardCard.classList.add('unboxing');
        }
        
        holdInterval = setInterval(() => {
            holdProgress += 50; // Update every 50ms
            const percentage = (holdProgress / holdDuration) * 100;
            
            // Update the conic gradient to show progress clockwise
            const gradientAngle = (percentage / 100) * 360;
            progressOutline.style.background = `conic-gradient(from 0deg, #ffd700 0%, #ffd700 ${gradientAngle}deg, transparent ${gradientAngle}deg, transparent 100%)`;
            
            // Add intensity effects as progress increases
            if (percentage > 25) {
                rewardBox.style.transform = `scale(${1 + (percentage - 25) * 0.008})`;
            }
            
            if (percentage > 50) {
                // Add more intense vibration
                if (navigator.vibrate && Math.random() > 0.7) {
                    navigator.vibrate(20);
                }
                
                // Add pulsing glow effect
                progressOutline.style.filter = `drop-shadow(0 0 ${percentage * 0.5}px rgba(255, 215, 0, 0.8))`;
            }
            
            if (percentage > 75) {
                // Final intensity burst - smooth transitions only
                rewardBox.style.filter = `saturate(${1 + (percentage - 75) * 0.02})`;
            }
            
            if (holdProgress >= holdDuration) {
                completeUnboxing(reward);
            }
        }, 50);
        
        // Add vibration effect on mobile
        if (navigator.vibrate) {
            navigator.vibrate([10, 50, 10]);
        }
    }
    
    function stopHold() {
        isHolding = false;
        rewardBox.classList.remove('unboxing', 'progress-active');
        clearInterval(holdInterval);
        
        // Get the progress outline element and reset it
        const progressOutline = document.getElementById('progress-outline');
        progressOutline.style.background = `conic-gradient(from 0deg, #ffd700 0%, #ffd700 0%, transparent 0%, transparent 100%)`;
        
        // Remove glowing effect from the reward card
        const rewardCard = document.querySelector(`[data-day="${reward.day}"]`);
        if (rewardCard) {
            rewardCard.classList.remove('unboxing');
        }
        
        // Reset all visual effects
        holdProgress = 0;
        rewardBox.style.transform = '';
        rewardBox.style.filter = '';
        progressOutline.style.filter = '';
    }
    
    function completeUnboxing(reward) {
        clearInterval(holdInterval);
        rewardBox.classList.remove('unboxing');
        rewardBox.classList.add('burst');
        
        // Reset all hold effects
        rewardBox.style.transform = '';
        rewardBox.style.filter = '';
        progressOutline.style.filter = '';
        
        // MASSIVE vibration feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100, 50, 200]);
        }
        
        // Create EPIC particle explosion
        createParticleExplosion();
        
        // Show reward after a short delay
        setTimeout(() => {
            holdInstruction.style.display = 'none';
            document.getElementById('reward-title').textContent = reward.title;
            document.getElementById('reward-description').textContent = reward.description;
            
            const rarityElement = document.getElementById('reward-rarity');
            rarityElement.textContent = reward.rarity;
            rarityElement.className = `reward-rarity rarity-${reward.rarity}`;
            
            rewardReveal.style.display = 'block';
            rewardReveal.classList.add('active');
            
            // Mark as claimed
            gameState.claimedRewards.push(reward.day);
            saveGameState();
            
        }, 800);
    }
    
    // Event listeners for hold interaction
    rewardBox.addEventListener('mousedown', startHold);
    rewardBox.addEventListener('mouseup', stopHold);
    rewardBox.addEventListener('mouseleave', stopHold);
    
    rewardBox.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHold();
    });
    rewardBox.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopHold();
    });
    rewardBox.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        stopHold();
    });
}

// Open view modal for already claimed rewards
function openViewModal(reward) {
    const modal = document.getElementById('modal-overlay');
    const rewardBox = document.getElementById('reward-box');
    const holdInstruction = document.querySelector('.hold-instruction');
    const rewardReveal = document.getElementById('reward-reveal');
    
    // Reset modal state
    modal.classList.add('active');
    holdInstruction.style.display = 'none'; // Hide hold instruction
    rewardReveal.style.display = 'none';
    rewardReveal.classList.remove('active');
    rewardBox.classList.remove('unboxing', 'burst', 'progress-active');
    
    // Show the reward content immediately
    document.getElementById('reward-title').textContent = reward.title;
    document.getElementById('reward-description').textContent = reward.description;
    
    const rarityElement = document.getElementById('reward-rarity');
    rarityElement.textContent = reward.rarity;
    rarityElement.className = `reward-rarity rarity-${reward.rarity}`;
    
    rewardReveal.style.display = 'block';
    rewardReveal.classList.add('active');
    
    // Update the box icon to show the actual reward
    const boxIcon = document.querySelector('.box-icon');
    boxIcon.textContent = reward.icon;
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('active');
    
    // Reset the box icon back to present
    const boxIcon = document.querySelector('.box-icon');
    boxIcon.textContent = '🎁';
    
    // Re-render rewards to update claimed state
    renderRewards();
    
    // Clear any particles
    document.getElementById('particles').innerHTML = '';
}

// Create massive confetti explosion effect
function createParticleExplosion() {
    const particlesContainer = document.getElementById('particles');
    const colors = ['#ffd700', '#ff6b6b', '#4facfe', '#00f2fe', '#667eea', '#764ba2', '#a8edea', '#fed6e3'];
    const shapes = ['circle', 'square', 'triangle', 'star'];
    
    // Create 100 particles for intense explosion
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 12 + 6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Start from center of screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Random explosion direction
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 300 + 150;
        const finalX = centerX + Math.cos(angle) * velocity;
        const finalY = centerY + Math.sin(angle) * velocity;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.backgroundColor = color;
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.position = 'fixed';
        particle.style.borderRadius = shape === 'circle' ? '50%' : '0';
        particle.style.transform = shape === 'triangle' ? 'rotate(45deg)' : 'rotate(0deg)';
        particle.style.boxShadow = `0 0 ${size * 3}px ${color}`;
        particle.style.zIndex = '10001';
        
        // Add sparkle effect for some particles
        if (Math.random() > 0.7) {
            particle.style.background = `radial-gradient(circle, ${color}, transparent)`;
            particle.style.animation = 'sparkle 2s ease-out forwards';
        }
        
        particlesContainer.appendChild(particle);
        
        // Animate the explosion
        setTimeout(() => {
            particle.style.transition = 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            particle.style.left = finalX + 'px';
            particle.style.top = finalY + 'px';
            particle.style.opacity = '0';
            particle.style.transform += ' rotate(720deg) scale(0.1)';
        }, 50);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 2500);
    }
    
    // Add gentle screen shake effect (no flashing)
    document.body.style.animation = 'screenShake 0.5s ease-in-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

// Update current day display
function updateDayDisplay() {
    const currentDay = getCurrentDay();
    console.log(`Current day: ${currentDay}`);
    
    // You could add a day indicator to the UI here if desired
}

// Initialize the app
function init() {
    loadGameState();
    renderRewards();
    updateDayDisplay();
    
    // Set up close modal button
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    // Update every minute to check for new day
    setInterval(() => {
        const newCurrentDay = getCurrentDay();
        if (newCurrentDay !== gameState.currentDay) {
            gameState.currentDay = newCurrentDay;
            renderRewards();
            updateDayDisplay();
        }
    }, 60000);
    
    // Debug: Log current time and days for testing
    console.log('Current Denver time:', new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
    console.log('Start date:', gameState.startDate);
    console.log('Current day:', getCurrentDay());
    console.log('Claimed rewards:', gameState.claimedRewards);
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Debug functions (remove in production)
window.debugResetGame = function() {
    localStorage.removeItem('loginRewardsState');
    location.reload();
};

window.debugClaimAll = function() {
    gameState.claimedRewards = [1, 2, 3, 4, 5, 6, 7];
    saveGameState();
    renderRewards();
};

window.debugSetDay = function(day) {
    const now = new Date();
    const denver = new Date(now.toLocaleString("en-US", {timeZone: "America/Denver"}));
    gameState.startDate = new Date(denver.getTime() - (day - 1) * 24 * 60 * 60 * 1000);
    saveGameState();
    renderRewards();
    updateDayDisplay();
};
