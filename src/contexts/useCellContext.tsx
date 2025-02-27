import React, { createContext, useContext } from 'react';
import { CellContextProps } from '~/types/Cell';

export const CellContext = createContext<CellContextProps>({} as CellContextProps);

export const useCellContext = () => {
 return useContext(CellContext);
};





