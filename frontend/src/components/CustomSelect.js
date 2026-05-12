import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Wybierz opcję',
    name,
    className = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        setIsOpen(false);
        if (onChange) {
            // Simulate native event structure for compatibility with generic handleChange functions
            onChange({
                target: {
                    name: name,
                    value: optionValue
                }
            });
        }
    };

    const selectedOption = options.find(opt => opt.value === value) || null;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border ${isOpen ? 'border-gray-950 ring-2 ring-gray-950 ring-opacity-10' : 'border-gray-300'
                    } rounded-lg px-4 py-3 text-left focus:outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all text-gray-950 flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-400'
                    }`}
            >
                <span className="block truncate">
                    {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
                </span>
                <span className="pointer-events-none inset-y-0 right-0 flex items-center ml-2">
                    <svg
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>

            {/* Dropdown Options */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm origin-top animate-in fade-in zoom-in-95 duration-100">
                    {options.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-500">
                            Brak opcji do wyboru
                        </div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`relative cursor-pointer select-none py-2.5 px-4 block hover:bg-gray-100 ${value === option.value ? 'bg-gray-50 text-gray-950 font-medium' : 'text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="block truncate">{option.label}</span>
                                    {value === option.value && (
                                        <span className="flex items-center text-gray-950">
                                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
