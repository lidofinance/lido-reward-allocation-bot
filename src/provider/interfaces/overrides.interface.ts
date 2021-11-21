import { CallOverrides as CallOverridesSource } from '@ethersproject/contracts';
import { BlockTag } from './blocktag.interface';

export interface CallOverrides extends Omit<CallOverridesSource, 'blockTag'> {
  blockTag?: BlockTag;
}
