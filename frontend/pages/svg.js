import styled from 'styled-components';

const svgString = `<svg\n      width="350"\n      height="350"\n      version="1.1"\n      xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="350" height="350" fill="white" />\n      <text x="50%" y="49" font-size="24" font-weight="300" dominant-baseline="middle" text-anchor="middle">\n      ETH CALL\n      </text>\n      <line x1="40" y1="73" x2="310" y2="73" stroke="black" stroke-width="1.5" dominant-baseline="middle" text-anchor="middle" />\n      <text x="50%" y="110" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">\n        Price Feed: ETH/USD\n      </text>\n      <text x="50%" y="155" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">\n        Strike Price: $9888.0\n      </text>\n      <text class="small" x="50%" y="200" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">\n        Amount: 0.01 ETH\n      </text>\n      <text x="50%" y="245" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">\n        Expiry: 1653384830\n      </text>\n      <text x="50%" y="290" font-size="22" font-weight="200" dominant-baseline="middle" text-anchor="middle">\n        American Style\n      </text>\n    </svg>`;

export default function Svg() {
  return (
    <Container>
      <StyledSVG
        width="350"
        height="350"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="350" height="350" fill="white" />

        <text
          x="50%"
          y="49"
          fontSize="25"
          fontWeight="200"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          ETH CALL
        </text>
        <line x1="40" y1="65" x2="310" y2="65" stroke="black" strokeWidth="1" />
        <text
          x="50%"
          y="105"
          fontSize="20"
          fontWeight="200"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          Price Feed: ETH/USD
        </text>
        <text
          x="50%"
          y="150"
          fontSize="20"
          fontWeight="200"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          Strike Price: $2000
        </text>
        <text
          x="50%"
          y="195"
          fontSize="20"
          fontWeight="200"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          Amount: 1 ETH
        </text>
        <text
          x="50%"
          y="240"
          fontSize="20"
          fontWeight="200"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          Expiry: 2023-01-01
        </text>
        <text
          x="50%"
          y="285"
          fontSize="20"
          fontWeight="200"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          American Style
        </text>
      </StyledSVG>
      <img src={`data:image/svg+xml;utf8,${svgString}`}></img>
    </Container>
  );
}

const StyledSVG = styled.svg`
  border: 2px solid black;

  .arg {
    font: italic 40px serif;
    fill: red;
  }
`;

const Container = styled.div`
  img {
    border: 1px solid black;
  }
  margin: 20px;
  display: flex;
  gap: 50px;
  justify-content: center;
  align-items: center;
`;
