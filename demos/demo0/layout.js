import React from 'react';
import { Flex, InlineBlock, Block, curry } from 'jsxstyle';

export const HCenter = curry(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
});

export const Center = curry(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

export const VSpacer = curry(Block, {
  marginBottom: '5px'
});

export const TwoColumn = ({ width, flexLeft, flexRight, children }) => {
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
};
