/**
 * 飞机故事系统
 */

import { SHIP_CONFIGS, SHIP_STORIES, hasShip } from './ships.js';
import { Modal } from './ui/index.js';

// 渲染故事界面
export function renderStoryScreen() {
  const screen = document.getElementById('story-screen');
  if (!screen) return;
  
  const ownedShips = SHIP_CONFIGS.filter(ship => hasShip(ship.id));
  
  let contentHtml = '';
  
  if (ownedShips.length === 0) {
    contentHtml = '<div class="empty-state">还没有拥有的飞机</div>';
  } else {
    contentHtml = '<div class="story-grid">';
    
    ownedShips.forEach(ship => {
      const story = SHIP_STORIES[ship.id];
      if (!story) return;
      
      contentHtml += `
        <div class="story-card" data-ship="${ship.id}">
          <div class="story-card-glow" style="background: ${ship.color}"></div>
          <div class="story-card-content">
            <div class="story-card-rank rank-${ship.rank.toLowerCase()}">${ship.rank}</div>
            <div class="story-card-title">${story.title}</div>
            <div class="story-card-subtitle">${story.subtitle}</div>
            <div class="story-card-preview">${story.quote}</div>
          </div>
        </div>
      `;
    });
    
    contentHtml += '</div>';
  }
  
  screen.innerHTML = `
    <button id="story-back-btn" class="back-btn-fixed">← 返回</button>
    <div class="story-content">
      <h2 style="color: #9d8df7; margin-bottom: 20px;">📖 飞机故事</h2>
      <div class="story-container" id="story-container">
        ${contentHtml}
      </div>
    </div>
  `;
  
  // 绑定返回按钮
  document.getElementById('story-back-btn')?.addEventListener('click', () => {
    document.getElementById('story-screen').classList.add('hidden');
    document.getElementById('upgrade-screen').classList.remove('hidden');
  });
  
  // 绑定点击事件
  if (ownedShips.length > 0) {
    document.getElementById('story-container').querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', () => {
        const shipId = card.dataset.ship;
        showStoryDetail(shipId);
      });
    });
  }
}

// 显示故事详情
function showStoryDetail(shipId) {
  const ship = SHIP_CONFIGS.find(s => s.id === shipId);
  const story = SHIP_STORIES[shipId];
  
  if (!ship || !story) return;
  
  const formattedContent = story.content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => `<p>${line}</p>`)
    .join('');
  
  const html = `
    <div class="story-modal-content">
      <div class="story-modal-header">
        <div class="story-modal-glow" style="background: ${ship.color}"></div>
        <div class="story-modal-title-area">
          <div class="story-modal-rank rank-${ship.rank.toLowerCase()}">${ship.rank}</div>
          <h3>${story.title}</h3>
          <div class="story-modal-subtitle">${story.subtitle}</div>
        </div>
      </div>
      <div class="story-modal-body">
        ${formattedContent}
      </div>
      <div class="story-modal-quote">
        <span class="quote-mark">"</span>
        ${story.quote.replace(/"/g, '')}
        <span class="quote-mark">"</span>
      </div>
      <div class="story-modal-footer">
        <button class="close-modal-btn">返回</button>
      </div>
    </div>
  `;
  
  const modal = new Modal({
    content: html,
    className: 'story-modal'
  });
  
  modal.show();
  
  // 绑定关闭按钮
  modal.element.querySelector('.close-modal-btn')?.addEventListener('click', () => {
    modal.close();
  });
}
