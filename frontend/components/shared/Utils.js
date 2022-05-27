import styled from 'styled-components';

export const Spinner = () => {
  return (
    <SpinnerStyle>
      <div className="spinner-container">
        <div className="loading-spinner"></div>
      </div>
    </SpinnerStyle>
  );
};

const SpinnerStyle = styled.div`
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .loading-spinner {
    width: 25px;
    height: 25px;
    border: 6px solid #f3f3f3; /* Light grey */
    border-top: 6px solid #383636; /* Blue */
    border-radius: 50%;
    animation: spinner 1.5s linear infinite;
  }

  .spinner-container {
    display: grid;
    justify-content: center;
    align-items: center;
    /* height: 350px; */
  }
`;
