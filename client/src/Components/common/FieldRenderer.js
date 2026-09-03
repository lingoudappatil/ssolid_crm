import React from 'react';

const FieldRenderer = ({ field, value, onChange }) => {
  const handleChange = (e) => {
    onChange(field.id, e.target.value);
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'number':
    case 'date':
      return (
        <div className="form-group">
          <label htmlFor={field.id}>{field.label}{field.required ? ' *' : ''}</label>
          <input
            type={field.type}
            id={field.id}
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            min={field.type === 'number' ? field.min : undefined}
            max={field.type === 'number' ? field.max : undefined}
            className="form-control"
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="form-group">
          <label htmlFor={field.id}>{field.label}{field.required ? ' *' : ''}</label>
          <textarea
            id={field.id}
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 4}
            className="form-control"
          />
        </div>
      );

    case 'select':
      return (
        <div className="form-group">
          <label htmlFor={field.id}>{field.label}{field.required ? ' *' : ''}</label>
          <select
            id={field.id}
            value={value}
            onChange={handleChange}
            required={field.required}
            className="form-control"
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label || opt.value}
              </option>
            ))}
          </select>
        </div>
      );

    case 'radio':
      return (
        <div className="form-group">
          <label>{field.label}{field.required ? ' *' : ''}</label>
          <div className="radio-group">
            {field.options?.map(opt => (
              <label key={opt.value} className="radio-label">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={handleChange}
                  required={field.required}
                />
                {opt.label || opt.value}
              </label>
            ))}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              id={field.id}
              checked={value === 'true' || value === true}
              onChange={e => onChange(field.id, e.target.checked)}
              required={field.required}
            />
            {field.label}{field.required ? ' *' : ''}
          </label>
        </div>
      );

    default:
      return (
        <div className="form-group">
          <label>Unsupported field type: {field.type}</label>
        </div>
      );
  }
};

export default FieldRenderer;