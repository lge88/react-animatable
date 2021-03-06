import React from 'react';
import { Flex, curry } from 'jsxstyle';
import makePureComponent from './makePureComponent';

export const HCenter = curry(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
});

export const Center = curry(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

export const TwoColumn = makePureComponent(
  ({ width, flexLeft, flexRight, children }) => {
    const [ left, right ] = children;
    return (
      <Flex width={width}
            flexDirection="row"
            justifyContent="space-between"
            >
        <Center key="left"
                flex={flexLeft}
                >
          { left }
        </Center>
        <Center key="right"
                flex={flexRight}
                >
          {right}
        </Center>
      </Flex>
    );
  }
);
