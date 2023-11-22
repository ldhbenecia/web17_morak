import { useState, useEffect } from 'react';

import { Input, Button, Textarea } from '@/components';

import * as styles from './index.css';

export function MogacoPostPage() {
  const [date, setDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 16);
    setDate(today);
  }, []);

  return (
    <form className={styles.container}>
      <div className={styles.formContent}>
        <input
          type="text"
          className={styles.title}
          placeholder="모각코 함께해요"
          required
        />
      </div>
      <div className={styles.formContent}>
        <Input
          label="작성자"
          maxLength={64}
          required
          disabled
          defaultValue="user"
        />
        <Input label="그룹" placeholder="그룹을 선택해주세요" required />
        <Input
          label="최대 인원 수"
          type="number"
          placeholder="20"
          min={1}
          max={20}
          required
        />
        <Input label="장소" placeholder="장소를 검색해주세요" required />
        <Input
          label="날짜 및 시간"
          type="datetime-local"
          required
          defaultValue={date}
          min={date}
        />
        <Textarea label="설명" maxLength={1000} />
      </div>
      <div className={styles.formContent}>
        <Button
          type="submit"
          theme="primary"
          shape="fill"
          size="large"
          fullWidth
          onClick={() => {}}
        >
          등록하기
        </Button>
      </div>
    </form>
  );
}
