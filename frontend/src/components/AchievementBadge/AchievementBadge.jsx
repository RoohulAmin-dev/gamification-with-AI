const AchievementBadge = ({ achievement, getTierColor, showProgress = false, progressPercent = 0 }) => {
  const color = getTierColor(achievement.tier);

  return (
    <div
      className="achievement-badge"
      style={{
        border: `2px solid ${color}`,
        opacity: achievement.locked ? 0.4 : 1,
      }}
      title={`${achievement.title}: ${achievement.description}`}
    >
      <div
        className="achievement-icon"
        style={{
          background: `linear(135deg, ${color}20, ${color}10)`,
          color: color,
        }}
      >
        {achievement.icon}
      </div>
      <div className="achievement-info">
        <div className="achievement-title">{achievement.title}</div>
        <div className="achievement-desc">{achievement.description}</div>
        {showProgress && (
          <div className="achievement-progress-bar">
            <div
              className="achievement-progress-fill"
              style={{
                width: `${progressPercent * 100}%`,
                background: color,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementBadge;
