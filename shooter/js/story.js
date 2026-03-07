/**
 * 飞机故事系统
 */

import { SHIP_CONFIGS, SHIP_STORIES, hasShip } from './ships.js';

// 渲染故事界面
export function renderStoryScreen() {
    const container = document.getElementById('story-container');
    if (!container) return;
    
    const ownedShips = SHIP_CONFIGS.filter(ship => hasShip(ship.id));
    
    if (ownedShips.length === 0) {
        container.innerHTML = '<div class="empty-state">还没有拥有的飞机</div>';
        return;
    }
    
    let html = '<div class="story-grid">';
    
    ownedShips.forEach(ship => {
        const story = SHIP_STORIES[ship.id];
        if (!story) return;
        
        html += `
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
    
    html += '</div>';
    container.innerHTML = html;
    
    // 绑定点击事件
    container.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', () => {
            const shipId = card.dataset.ship;
            showStoryDetail(shipId);
        });
    });
}

// 显示故事详情
function showStoryDetail(shipId) {
    const ship = SHIP_CONFIGS.find(s => s.id === shipId);
    const story = SHIP_STORIES[shipId];
    
    if (!ship || !story) return;
    
    const modal = document.createElement('div');
    modal.className = 'story-modal';
    
    // 格式化内容（保留段落）
    const formattedContent = story.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => `<p>${line}</p>`)
        .join('');
    
    modal.innerHTML = `
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
    
    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}