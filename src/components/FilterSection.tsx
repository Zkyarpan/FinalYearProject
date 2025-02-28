'use client';

import React, { useState } from 'react';
import { ChevronDown, CircleX } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';

const FilterSection = ({ onFilter }) => {
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');

  // Dropdown states
  const [specializationsOpen, setSpecializationsOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [priceRangeOpen, setPriceRangeOpen] = useState(false);

  // Options
  const specializations = [
    'Anxiety',
    'Depression',
    'Stress',
    'Relationships',
    'Trauma',
  ];
  const languages = ['English', 'Spanish', 'French', 'German', 'Mandarin'];
  const formats = ['Video', 'Phone', 'In-person'];
  const priceRanges = ['$50-100', '$100-150', '$150-200', '$200+'];

  const handleFilter = () => {
    onFilter({
      specializations: selectedSpecializations,
      languages: selectedLanguages,
      format: selectedFormat,
      priceRange: selectedPriceRange,
    });
  };

  const handleClear = () => {
    setSelectedSpecializations([]);
    setSelectedLanguages([]);
    setSelectedFormat('');
    setSelectedPriceRange('');
    onFilter({});
  };

  // Custom dropdown component
  const CustomDropdown = ({
    options,
    selected,
    setSelected,
    isOpen,
    setIsOpen,
    placeholder,
    maxSelect = 1,
  }) => {
    const dropdownRef = useClickOutside(() => setIsOpen(false));

    return (
      <div ref={dropdownRef} className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-1 outline-none text-sm rounded-lg border transition-all duration-100 group bg-gray-00  border-gray-200 dark:border-[#333333] bg-gray-00 text-gray-1k hover:border-gray-300 focus-within:border-gray-300 dark:bg-input shadow-input hover:shadow-input-hover focus-within:shadow-input cursor-pointer"
        >
          <div className="css-8akrpk flex items-center justify-between px-3 py-1">
            <div className="flex flex-wrap gap-1">
              {Array.isArray(selected) && selected.length > 0 ? (
                selected.map(item => (
                  <span
                    key={item}
                    className="bg-gray-100 px-2 py-0.5 rounded text-xs dark:bg-input"
                  >
                    {item}
                  </span>
                ))
              ) : selected ? (
                <span>{selected}</span>
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto dark:bg-input dark:border-[#333333]">
            {options.map(option => (
              <div
                key={option}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 hover:dark:bg-[#505050]
                  ${
                    Array.isArray(selected)
                      ? selected.includes(option)
                        ? 'bg-gray-50 dark:bg-[#505050]'
                        : ''
                      : selected === option
                      ? 'bg-gray-50 dark:bg-[#505050]'
                      : ''
                  }`}
                onClick={() => {
                  if (maxSelect === 1) {
                    setSelected(option);
                  } else {
                    setSelected(prev =>
                      prev.includes(option)
                        ? prev.filter(item => item !== option)
                        : prev.length < maxSelect
                        ? [...prev, option]
                        : prev
                    );
                  }
                  if (maxSelect === 1) setIsOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="">
      <div>
        <p className="text-gray-1k font-semibold text-sm">Filter by</p>

        {/* Specializations Filter */}
        <div className="my-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-1k">
                Specializations
              </label>
              <span className="text-gray-500 text-[10px] font-normal">
                Upto 10
              </span>
            </div>
            <CustomDropdown
              options={specializations}
              selected={selectedSpecializations}
              setSelected={setSelectedSpecializations}
              isOpen={specializationsOpen}
              setIsOpen={setSpecializationsOpen}
              placeholder="Select specializations"
              maxSelect={10}
            />
          </div>
        </div>

        {/* Languages Filter */}
        <div className="mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-1k">
                Languages
              </label>
              <span className="text-gray-500 text-[10px] font-normal">
                Upto 3
              </span>
            </div>
            <CustomDropdown
              options={languages}
              selected={selectedLanguages}
              setSelected={setSelectedLanguages}
              isOpen={languagesOpen}
              setIsOpen={setLanguagesOpen}
              placeholder="Select languages"
              maxSelect={3}
            />
          </div>
        </div>

        {/* Session Format */}
        <div className="mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-1k">
                Session Format
              </label>
              <span className="text-gray-500 text-[10px] font-normal">
                Select one
              </span>
            </div>
            <CustomDropdown
              options={formats}
              selected={selectedFormat}
              setSelected={setSelectedFormat}
              isOpen={formatOpen}
              setIsOpen={setFormatOpen}
              placeholder="Select format"
              maxSelect={1}
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-1k">
                Price Range
              </label>
              <span className="text-gray-500 text-[10px] font-normal">
                Select one
              </span>
            </div>
            <CustomDropdown
              options={priceRanges}
              selected={selectedPriceRange}
              setSelected={setSelectedPriceRange}
              isOpen={priceRangeOpen}
              setIsOpen={setPriceRangeOpen}
              placeholder="Select price range"
              maxSelect={1}
            />
          </div>
        </div>

        {/* Selected Filters Display */}
        {(selectedSpecializations.length > 0 ||
          selectedLanguages.length > 0 ||
          selectedFormat ||
          selectedPriceRange) && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Selected Filters:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSpecializations.map(spec => (
                <span
                  key={spec}
                  className="bg-gray-100 dark:bg-input border px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                >
                  {spec}
                  <button
                    onClick={() =>
                      setSelectedSpecializations(prev =>
                        prev.filter(s => s !== spec)
                      )
                    }
                    className="hover:text-red-500"
                  >
                    <CircleX className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {selectedLanguages.map(lang => (
                <span
                  key={lang}
                  className="bg-gray-100 dark:bg-input border px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                >
                  {lang}
                  <button
                    onClick={() =>
                      setSelectedLanguages(prev => prev.filter(l => l !== lang))
                    }
                    className="hover:text-red-500"
                  >
                    <CircleX className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {selectedFormat && (
                <span className="bg-gray-100 dark:bg-input border px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  {selectedFormat}
                  <button
                    onClick={() => setSelectedFormat('')}
                    className="hover:text-red-500"
                  >
                    <CircleX className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedPriceRange && (
                <span className="bg-gray-100 dark:bg-input border px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  {selectedPriceRange}
                  <button
                    onClick={() => setSelectedPriceRange('')}
                    className="hover:text-red-500"
                  >
                    <CircleX className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={handleClear}
            disabled={
              !(
                selectedSpecializations.length ||
                selectedLanguages.length ||
                selectedFormat ||
                selectedPriceRange
              )
            }
            className="flex items-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-xs leading-4 py-1 h-6 rounded-lg px-3 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-blue-600"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleFilter}
            disabled={
              !(
                selectedSpecializations.length ||
                selectedLanguages.length ||
                selectedFormat ||
                selectedPriceRange
              )
            }
            className="flex items-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-xs leading-4 py-1 h-6 rounded-lg px-3 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-blue-600"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
