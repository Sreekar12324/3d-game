// 3D Space Mining Game - AURORA Mission
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const fuelEl = document.getElementById('fuel');
const mineralsEl = document.getElementById('minerals');
const velocityEl = document.getElementById('velocity');
const messageEl = document.getElementById('message');

// Input handling
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm() { const m = this.mag(); return m > 0 ? this.mul(1/m) : new Vector2(); }
}

class SpaceObject {
  constructor(x, y, radius, color) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2();
    this.radius = radius;
    this.color = color;
  }
  
  update(dt) {
    this.pos = this.pos.add(this.vel.mul(dt * 60));
    
    // Wrap around
    if (this.pos.x < -100) this.pos.x = canvas.width + 100;
    if (this.pos.x > canvas.width + 100) this.pos.x = -100;
    if (this.pos.y < -100) this.pos.y = canvas.height + 100;
    if (this.pos.y > canvas.height + 100) this.pos.y = -100;
  }
}

class Planet extends SpaceObject {
  constructor(x, y, radius, hue) {
    super(x, y, radius, `hsl(${hue}, 60%, 45%)`);
    this.hue = hue;
    this.name = 'Planet';
  }
  
  draw(ctx) {
    const gradient = ctx.createRadialGradient(
      this.pos.x - this.radius * 0.3,
      this.pos.y - this.radius * 0.3,
      this.radius * 0.2,
      this.pos.x,
      this.pos.y,
      this.radius
    );
    gradient.addColorStop(0, `hsl(${this.hue}, 80%, 70%)`);
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, `hsl(${this.hue}, 40%, 20%)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Atmosphere glow
    ctx.strokeStyle = `hsla(${this.hue}, 70%, 60%, 0.3)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

class Asteroid extends SpaceObject {
  constructor(x, y, radius) {
    super(x, y, radius, '#6c757d');
    this.vel = new Vector2(rand(-0.3, 0.3), rand(-0.3, 0.3));
    this.rotation = rand(0, Math.PI * 2);
    this.points = [];
    for (let i = 0; i < 8; i++) {
      this.points.push(rand(0.7, 1.0));
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);
    
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++) {
      const angle = (i / this.points.length) * Math.PI * 2;
      const r = this.radius * this.points[i];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class Mineral extends SpaceObject {
  constructor(x, y) {
    super(x, y, 6, '#0ff');
    this.collected = false;
    this.pulsePhase = rand(0, Math.PI * 2);
  }
  
  draw(ctx, time) {
    if (this.collected) return;
    
    const pulse = 0.8 + Math.sin(time * 3 + this.pulsePhase) * 0.2;
    const glowRadius = 20 * pulse;
    
    const glow = ctx.createRadialGradient(
      this.pos.x, this.pos.y, 0,
      this.pos.x, this.pos.y, glowRadius
    );
    glow.addColorStop(0, 'rgba(0,255,255,1)');
    glow.addColorStop(0.5, 'rgba(0,200,255,0.5)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Crystal shape
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(time * 2);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 4);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}


class Ship {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2();
    this.angle = -Math.PI / 2;
    this.fuel = 100;
    this.alive = true;
    this.tractorActive = false;
  }
  
  update(dt, game) {
    if (!this.alive) return;
    
    // Rotation
    if (keys['arrowleft']) this.angle -= 4 * dt;
    if (keys['arrowright']) this.angle += 4 * dt;
    
    // Thrust
    if (keys['arrowup'] && this.fuel > 0) {
      const thrustPower = 150;
      const ax = Math.cos(this.angle) * thrustPower;
      const ay = Math.sin(this.angle) * thrustPower;
      this.vel.x += ax * dt;
      this.vel.y += ay * dt;
      this.fuel = Math.max(0, this.fuel - 15 * dt);
    }
    
    // Apply velocity
    this.pos = this.pos.add(this.vel.mul(dt));
    
    // Screen wrap
    if (this.pos.x < 0) this.pos.x = canvas.width;
    if (this.pos.x > canvas.width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = canvas.height;
    if (this.pos.y > canvas.height) this.pos.y = 0;
    
    // Tractor beam
    this.tractorActive = keys[' '] && this.fuel > 5;
    if (this.tractorActive) {
      this.fuel -= 10 * dt;
      game.minerals.forEach(m => {
        if (m.collected) return;
        const diff = this.pos.sub(m.pos);
        const dist = diff.mag();
        if (dist < 150 && dist > 1) {
          m.pos = m.pos.add(diff.norm().mul(200 * dt));
        }
      });
    }
    
    // Collision with planets
    const speed = this.vel.mag();
    game.planets.forEach(p => {
      const diff = this.pos.sub(p.pos);
      const dist = diff.mag();
      if (dist < p.radius + 12) {
        if (speed > 60) {
          this.alive = false;
          game.gameOver = true;
          messageEl.textContent = `Crashed into ${p.name}! Press R to retry.`;
        } else {
          // Soft landing - refuel
          this.fuel = Math.min(100, this.fuel + 30);
          this.vel = this.vel.mul(0.3);
          const pushOut = diff.norm().mul(p.radius + 13);
          this.pos = p.pos.add(pushOut);
          messageEl.textContent = `Refueled at ${p.name}!`;
        }
      }
    });
    
    // Collision with asteroids
    game.asteroids.forEach(a => {
      const diff = this.pos.sub(a.pos);
      const dist = diff.mag();
      if (dist < a.radius + 10 && speed > 50) {
        this.alive = false;
        game.gameOver = true;
        messageEl.textContent = 'Asteroid collision! Press R to retry.';
      }
    });
    
    // Collect minerals
    game.minerals.forEach(m => {
      if (m.collected) return;
      const diff = this.pos.sub(m.pos);
      if (diff.mag() < 15) {
        m.collected = true;
        game.collected++;
        messageEl.textContent = `Mineral collected! (${game.collected}/10)`;
        if (game.collected >= 10) {
          this.alive = false;
          game.gameWon = true;
          messageEl.textContent = 'Mission complete! All minerals collected! Press R for new mission.';
        }
      }
    });
    
    // Check fuel
    if (this.fuel <= 0 && !game.gameWon) {
      this.alive = false;
      game.gameOver = true;
      messageEl.textContent = 'Out of fuel! Press R to retry.';
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle + Math.PI / 2);
    
    // Ship body
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#4df';
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings
    ctx.fillStyle = '#f55';
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(18, 12);
    ctx.lineTo(8, 12);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-18, 12);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();
    
    // Thruster
    if (keys['arrowup'] && this.fuel > 0 && this.alive) {
      ctx.fillStyle = `hsl(${rand(20,40)}, 100%, 60%)`;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(5, 20 + rand(0, 5));
      ctx.lineTo(-5, 20 + rand(0, 5));
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }
}


class Game {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.planets = [];
    this.asteroids = [];
    this.minerals = [];
    this.collected = 0;
    this.gameOver = false;
    this.gameWon = false;
    
    // Create planets
    for (let i = 0; i < 5; i++) {
      const p = new Planet(
        rand(200, canvas.width - 200),
        rand(200, canvas.height - 200),
        rand(50, 90),
        rand(180, 280)
      );
      p.name = ['Kepler-442b', 'Proxima-b', 'TRAPPIST-1e', 'HD 40307g', 'Gliese 667Cc'][i];
      this.planets.push(p);
    }
    
    // Create asteroids
    for (let i = 0; i < 15; i++) {
      this.asteroids.push(new Asteroid(
        rand(0, canvas.width),
        rand(0, canvas.height),
        rand(12, 28)
      ));
    }
    
    // Create minerals near planets/asteroids
    for (let i = 0; i < 25; i++) {
      const anchor = Math.random() < 0.6 
        ? this.planets[Math.floor(rand(0, this.planets.length))]
        : this.asteroids[Math.floor(rand(0, this.asteroids.length))];
      
      const angle = rand(0, Math.PI * 2);
      const dist = anchor.radius + rand(15, 80);
      const x = anchor.pos.x + Math.cos(angle) * dist;
      const y = anchor.pos.y + Math.sin(angle) * dist;
      
      this.minerals.push(new Mineral(x, y));
    }
    
    this.ship = new Ship(canvas.width / 2, canvas.height / 2);
    this.time = 0;
    messageEl.textContent = 'Collect 10 minerals to complete mission!';
  }
  
  update(dt) {
    if (keys['r']) {
      this.reset();
      return;
    }
    
    this.time += dt;
    
    this.ship.update(dt, this);
    this.planets.forEach(p => p.update(dt));
    this.asteroids.forEach(a => a.update(dt));
    
    // Update UI
    fuelEl.textContent = Math.floor(this.ship.fuel) + '%';
    mineralsEl.textContent = `${this.collected} / 10`;
    velocityEl.textContent = this.ship.vel.mag().toFixed(2);
  }
  
  draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 200; i++) {
      const x = (i * 67) % canvas.width;
      const y = (i * 191) % canvas.height;
      const depth = (i % 10) / 10;
      ctx.globalAlpha = 0.2 + depth * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, 1 + depth, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Draw planets
    this.planets.forEach(p => p.draw(ctx));
    
    // Draw asteroids
    this.asteroids.forEach(a => a.draw(ctx));
    
    // Draw minerals
    this.minerals.forEach(m => m.draw(ctx, this.time));
    
    // Tractor beam
    if (this.ship.tractorActive) {
      const grad = ctx.createRadialGradient(
        this.ship.pos.x, this.ship.pos.y, 10,
        this.ship.pos.x, this.ship.pos.y, 150
      );
      grad.addColorStop(0, 'rgba(100,200,255,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.ship.pos.x, this.ship.pos.y, 150, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw ship
    this.ship.draw(ctx);
    
    // Vignette
    const vignette = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 100,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

const game = new Game();
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  
  game.update(dt);
  game.draw();
  
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
