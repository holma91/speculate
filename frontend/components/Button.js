import React from 'react';
import styled from 'styled-components';

export function Button({ children, className, ...rest }) {
  return (
    <StyledButton type="button" {...rest}>
      {children}
    </StyledButton>
  );
}

const StyledButton = styled.button`
  position: relative; // relative
  display: inline-flex; // inline-flex
  align-items: center; // items-center
  padding-left: 1rem; // px-4
  padding-right: 1rem;
  padding-top: 0.5rem; // py-2
  padding-bottom: 0.5rem;
  border-width: 1px; // border
  border-color: rgb(209 213 219); // border-gray-300
  font-size: 0.875rem; /* 14px */ // text-sm
  line-height: 1.25rem; /* 20px */
  font-weight: 500; // font-medium
  border-radius: 0.375rem; /* 6px */ // rounded-md
  color: rgb(55 65 81); // text-gray-700
  background-color: rgb(255 255 255); // bg-white
  // hover:bg-gray-50
  :hover {
    background-color: rgb(249 250 251);
  }
`;

export function PageButton({ children, className, ...rest }) {
  return (
    <StyledPageButton type="button" {...rest}>
      {children}
    </StyledPageButton>
  );
}

const StyledPageButton = styled.button`
  position: relative; // relative
  display: inline-flex; // inline-flex
  align-items: center; // items-center
  padding-left: 0.5rem; // px-4
  padding-right: 0.5rem;
  padding-top: 0.5rem; // py-2
  padding-bottom: 0.5rem;
  /* border-width: 1px; // border */
  border-color: rgb(209 213 219); // border-gray-300
  font-size: 0.875rem; /* 14px */ // text-sm
  line-height: 1.25rem; /* 20px */
  font-weight: 500; // font-medium
  color: rgb(107 114 128); // text-gray-500
  background-color: rgb(255 255 255); // bg-white
  // hover:bg-gray-50
  // rounded-l-md
  border-top-left-radius: ${(props) =>
    props.pos === 'left' ? '0.375rem' : '0'};
  border-bottom-left-radius: ${(props) =>
    props.pos === 'left' ? '0.375rem' : '0'};

  border-top-right-radius: ${(props) =>
    props.pos === 'right' ? '0.375rem' : '0'};
  border-bottom-right-radius: ${(props) =>
    props.pos === 'right' ? '0.375rem' : '0'};

  border-left: ${(props) =>
    props.pos !== 'left' ? '1px solid rgb(209 213 219)' : '0'};
  :hover {
    background-color: rgb(249 250 251);
  }
`;
