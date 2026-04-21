/**
 * RoleTagInput
 *
 * A tag/chip input with autocomplete from existing roles.
 * - Chips render inline with the text cursor inside the same box
 * - Autocomplete dropdown suggests matching roles from `allRoles`
 * - Diverging text shows a "+ Add" entry at the bottom
 * - Enter / Tab / comma commit the current text
 * - Backspace on empty field removes the last chip
 * - Duplicate roles are silently ignored
 */

import React, { useState, useRef, useEffect } from 'react';

const RoleTagInput = ({
  value = [],
  onChange,
  allRoles = [],
  placeholder = 'Add role…',
}) => {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build suggestion list
  const trimmed = text.trim();
  const suggestions = allRoles.filter(
    (r) => !value.includes(r) && r.toLowerCase().includes(trimmed.toLowerCase())
  );
  const showAdd = trimmed.length > 0 && !allRoles.some(
    (r) => r.toLowerCase() === trimmed.toLowerCase()
  );
  const dropdownItems = [
    ...suggestions,
    ...(showAdd ? [`__add__:${trimmed}`] : []),
  ];

  const commit = (role) => {
    const clean = role.trim();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setText('');
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const removeRole = (role) => {
    onChange(value.filter((r) => r !== role));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (highlighted >= 0 && dropdownItems[highlighted]) {
        const item = dropdownItems[highlighted];
        e.preventDefault();
        commit(item.startsWith('__add__:') ? item.slice(8) : item);
      } else if (trimmed) {
        e.preventDefault();
        commit(trimmed);
      }
    } else if (e.key === ',') {
      e.preventDefault();
      if (trimmed) commit(trimmed);
    } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, dropdownItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setOpen(true);
    setHighlighted(-1);
  };

  const handleItemClick = (item) => {
    commit(item.startsWith('__add__:') ? item.slice(8) : item);
  };

  // Bold the matching portion of a suggestion label
  const highlight = (label, query) => {
    if (!query) return label;
    const idx = label.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <strong>{label.slice(idx, idx + query.length)}</strong>
        {label.slice(idx + query.length)}
      </>
    );
  };

  const s = {
    wrapper: {
      position: 'relative',
      display: 'inline-block',
      width: '100%',
    },
    box: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      background: '#fff',
      minHeight: '34px',
      cursor: 'text',
      boxSizing: 'border-box',
      width: '100%',
    },
    chip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '4px',
      padding: '1px 6px',
      fontSize: '12px',
      color: '#1d4ed8',
      whiteSpace: 'nowrap',
    },
    chipRemove: {
      cursor: 'pointer',
      color: '#93c5fd',
      fontSize: '14px',
      lineHeight: 1,
      background: 'none',
      border: 'none',
      padding: 0,
    },
    input: {
      border: 'none',
      outline: 'none',
      fontSize: '13px',
      flex: 1,
      minWidth: '80px',
      background: 'transparent',
      padding: '2px 0',
    },
    dropdown: {
      position: 'absolute',
      top: 'calc(100% + 2px)',
      left: 0,
      right: 0,
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 200,
      maxHeight: '180px',
      overflowY: 'auto',
    },
    item: (isHighlighted, isAdd) => ({
      padding: '7px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      background: isHighlighted ? '#f0f9ff' : '#fff',
      color: isAdd ? '#0ea5e9' : '#1f2937',
      borderBottom: '1px solid #f3f4f6',
    }),
  };

  return (
    <div style={s.wrapper} ref={containerRef}>
      <div style={s.box} onClick={() => inputRef.current?.focus()}>
        {value.map((role) => (
          <span key={role} style={s.chip}>
            {role}
            <button
              style={s.chipRemove}
              onMouseDown={(e) => { e.preventDefault(); removeRole(role); }}
              tabIndex={-1}
              title={`Remove ${role}`}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          style={s.input}
          value={text}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (text || allRoles.length) setOpen(true); }}
        />
      </div>

      {open && dropdownItems.length > 0 && (
        <div style={s.dropdown}>
          {dropdownItems.map((item, idx) => {
            const isAdd = item.startsWith('__add__:');
            const label = isAdd ? item.slice(8) : item;
            return (
              <div
                key={item}
                style={s.item(idx === highlighted, isAdd)}
                onMouseDown={(e) => { e.preventDefault(); handleItemClick(item); }}
                onMouseEnter={() => setHighlighted(idx)}
              >
                {isAdd ? `＋ Add "${label}" as new role` : highlight(label, trimmed)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleTagInput;
