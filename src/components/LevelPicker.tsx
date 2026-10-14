const LEVELS = [1, 2, 3, 4, 5, 6]

interface Props {
  level: number
  onChange: (level: number) => void
}

export function LevelPicker({ level, onChange }: Props) {
  return (
    <div className="level-picker" role="radiogroup" aria-label="Your HSK level">
      <span className="level-picker__label">HSK</span>
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === level}
          className={l === level ? 'level-picker__option is-active' : 'level-picker__option'}
          onClick={() => onChange(l)}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
