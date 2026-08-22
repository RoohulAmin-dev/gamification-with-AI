import { useEffect, useState } from "react";
import { getLearningHistory } from "../../services/historyService";

const LearningHistory = ({ userId, onSelectLesson }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await getLearningHistory(userId);

      if (error) {
        console.error("Failed to load learning history:", error);
      } else {
        setHistory(data || []);
      }

      setLoading(false);
    };

    loadHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="glass-card">
        <p>Loading your learning history...</p>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="glass-card">
        <h3>Your Learning History</h3>
        <p>Your generated lessons will appear here.</p>
      </div>
    );
  }

  return (
    <section className="learning-history">
      <div className="history-header">
        <h2>Your Learning History</h2>
        <p>Continue learning from topics you've explored before.</p>
      </div>

      <div className="history-list">
        {history.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            className="history-item"
            onClick={() => onSelectLesson?.(lesson)}
          >
            <div>
              <h3>{lesson.title || lesson.prompt}</h3>

              <p>{lesson.prompt}</p>

              <span>
                {lesson.learning_type || "Learning lesson"}
                {" • "}
                {lesson.difficulty || "Beginner"}
              </span>
            </div>

            <div className="history-arrow">→</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default LearningHistory;