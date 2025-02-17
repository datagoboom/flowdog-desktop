import { createContext, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';

const FormContext = createContext({});

export const useForm = () => useContext(FormContext);

const Form = ({
  children,
  onSubmit,
  onChange,
  initialValues = {},
  validate,
  className = '',
  ...props
}) => {
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const values = Object.fromEntries(formData.entries());

    // Handle array values (multiple select, checkboxes, etc.)
    for (const [key, value] of formData.entries()) {
      if (key.endsWith('[]')) {
        const arrayKey = key.slice(0, -2);
        if (!values[arrayKey]) {
          values[arrayKey] = formData.getAll(key);
        }
        delete values[key];
      }
    }

    // Custom validation
    if (validate) {
      try {
        const errors = await validate(values);
        if (errors && Object.keys(errors).length > 0) {
          // You can implement your own error handling here
          console.error('Validation errors:', errors);
          return;
        }
      } catch (error) {
        console.error('Validation failed:', error);
        return;
      }
    }

    onSubmit?.(values, event);
  }, [onSubmit, validate]);

  const handleChange = useCallback((event) => {
    const formData = new FormData(event.target.form);
    const values = Object.fromEntries(formData.entries());
    onChange?.(values, event);
  }, [onChange]);

  return (
    <FormContext.Provider value={{ initialValues }}>
      <form
        onSubmit={handleSubmit}
        onChange={handleChange}
        className={`space-y-4 ${className}`.trim()}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};

Form.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  initialValues: PropTypes.object,
  validate: PropTypes.func,
  className: PropTypes.string,
};

export default Form;