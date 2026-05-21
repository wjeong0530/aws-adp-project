import React, { useState, useEffect } from "react";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

// ⚠️ 본인의 S3 버킷 정보로 꼭 변경해 주세요!
const S3_BUCKET_NAME = "test-file-system-boeun";
const AWS_REGION = "ap-northeast-2";
const S3_BASE_URL = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]); // S3 파일 목록 저장용 state
  const [loadingList, setLoadingList] = useState(false);

  // 1. S3 버킷의 모든 파일 목록을 가져오는 함수 (XML 파싱)
  const fetchS3Files = async () => {
    setLoadingList(true);
    try {
      // S3 버킷 루트 주소로 GET 요청을 보내면 파일 목록 XML을 줍니다.
      const response = await fetch(S3_BASE_URL);
      if (!response.ok) throw new Error("파일 목록을 불러오지 못했습니다.");

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // XML 내부의 <Contents> 태그들을 찾아 파일명(Key) 추출
      const contents = xmlDoc.getElementsByTagName("Contents");
      const files = [];

      for (let i = 0; i < contents.length; i++) {
        const key = contents[i].getElementsByTagName("Key")[0].textContent;
        const size = contents[i].getElementsByTagName("Size")[0].textContent;
        const lastModified =
          contents[i].getElementsByTagName("LastModified")[0].textContent;

        files.push({
          name: key,
          url: `${S3_BASE_URL}/${key}`,
          size: (parseInt(size) / 1024).toFixed(2) + " KB",
          date: new Date(lastModified).toLocaleString(),
        });
      }

      setFileList(files);
    } catch (error) {
      console.error("S3 List Error:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // 컴포넌트가 처음 켜질 때 파일 목록 로드
  useEffect(() => {
    fetchS3Files();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 2. 파일 업로드 함수
  const handleFileUpload = async () => {
    if (!file) {
      alert("파일을 선택해 주세요!");
      return;
    }

    setUploading(true);
    const S3_URL = `${S3_BASE_URL}/${file.name}`;

    try {
      const response = await fetch(S3_URL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (response.ok) {
        alert("🎉 AWS S3에 파일 업로드 성공!");
        setFile(null);
        // 업로드 성공 후 목록을 자동으로 새로고침합니다.
        fetchS3Files();
      } else {
        throw new Error("S3 업로드 응답 실패");
      }
    } catch (error) {
      console.error(error);
      alert("업로드 실패! S3 권한이나 설정을 확인하세요.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2>☁️ AWS S3 버킷 다이렉트 연동 테스트</h2>

      {/* 업로드 섹션 */}
      <div
        style={{
          border: "2px dashed #3182ce",
          borderRadius: "10px",
          padding: "30px",
          textAlign: "center",
          backgroundColor: "#f7fafc",
          marginBottom: "40px",
        }}
      >
        <input
          type="file"
          onChange={handleFileChange}
          style={{ marginBottom: "15px" }}
        />
        {file && (
          <p style={{ fontSize: "14px", color: "#4a5568" }}>
            선택된 파일: {file.name}
          </p>
        )}
        <button
          onClick={handleFileUpload}
          disabled={uploading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {uploading ? "업로드 중..." : "S3에 업로드하기"}
        </button>
      </div>

      {/* 📋 S3 파일 리스트 섹션 */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ margin: 0 }}>
            📋 현재 S3 버킷 파일 목록 ({fileList.length})
          </h3>
          <button
            onClick={fetchS3Files}
            style={{ padding: "5px 10px", fontSize: "12px", cursor: "pointer" }}
          >
            🔄 새로고침
          </button>
        </div>

        {loadingList ? (
          <p>목록을 불러오는 중...</p>
        ) : fileList.length === 0 ? (
          <p style={{ color: "#a0aec0", textAlign: "center", padding: "20px" }}>
            버킷이 비어있습니다. 파일을 업로드해 보세요!
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {fileList.map((f, index) => (
              <li
                key={index}
                style={{
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "#2b6cb0",
                      fontWeight: "bold",
                      wordBreak: "break-all",
                    }}
                  >
                    {f.name}
                  </a>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#718096",
                      marginTop: "4px",
                    }}
                  >
                    용량: {f.size} | 업로드: {f.date}
                  </div>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "#edf2f7",
                    color: "#4a5568",
                    borderRadius: "4px",
                    fontSize: "12px",
                    textDecoration: "none",
                  }}
                >
                  열기 ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Authenticator>
          {({ signOut, user }) => (
            <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
              {/* 로그인 성공 시 유저 정보에 접근 가능 */}
              <h1>안녕하세요, {user?.username}님! 👋</h1>
              <p>성공적으로 Cognito 로그인 연동이 완료되었습니다.</p>

              {/* 로그아웃 버튼 (Amplify가 제공하는 signOut 함수 호출) */}
              <button
                onClick={signOut}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                로그아웃
              </button>
            </main>
          )}
        </Authenticator>
      </div>
    </div>
  );
}

export default App;
