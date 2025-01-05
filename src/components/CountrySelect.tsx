'use client';

import ReactSelect from 'react-select';
import type { StylesConfig } from 'react-select';

type CountryOption = {
  value: string;
  label: string;
};

const StyledCountrySelect = ({ formData, handleChange, countries }) => {
  const customStyles: StylesConfig<CountryOption, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      borderRadius: '0.5rem',
      padding: '2px',
      minHeight: '40px',
    }),
    menu: provided => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'hsl(var(--primary))'
        : state.isFocused
          ? 'hsl(var(--accent))'
          : 'transparent',
      color: state.isSelected
        ? 'hsl(var(--primary-foreground))'
        : 'hsl(var(--foreground))',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'hsl(var(--primary))',
      },
    }),
    singleValue: provided => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    input: provided => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    placeholder: provided => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: provided => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      '&:hover': {
        color: 'hsl(var(--foreground))',
      },
    }),
  };

  return (
    <div className="col-span-full">
      <label
        htmlFor="country"
        className="block text-sm font-medium text-foreground"
      >
        Country
      </label>
      <div className="mt-2">
        <ReactSelect
          instanceId="country-select" 
          id="country"
          name="country"
          value={countries.find(c => c.value === formData.country)}
          onChange={option =>
            option &&
            handleChange({
              target: { name: 'country', value: option.value },
            })
          }
          options={countries}
          classNamePrefix="react-select"
          placeholder="Select Country"
          isDisabled={!countries.length}
          isLoading={!countries.length}
          noOptionsMessage={() =>
            !countries.length ? 'Loading countries...' : 'No countries found'
          }
          styles={customStyles}
        />
      </div>
    </div>
  );
};

export default StyledCountrySelect;
