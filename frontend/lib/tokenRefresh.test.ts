import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearToken, getToken, saveToken } from './tokenRefresh';

describe('tokenRefresh', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('behält das Token, bis es gelöscht wird', () => {
    saveToken('keep-me');
    expect(getToken()).toBe('keep-me');
  });

  it('löscht das Token beim Logout', () => {
    saveToken('gone');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
