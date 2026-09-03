import { Clock3, MessageCircleMore, Sparkles, UsersRound } from 'lucide-react'
import { getAudienceProfile } from '../lib/audienceProfile'

export default function AccountAudienceProfile({ account = {} }) {
  const profile = getAudienceProfile(account)

  return <section className="audience-profile-card">
    <div className="audience-profile-head">
      <div>
        <span className="eyebrow"><UsersRound size={13} /> ACCOUNT AUDIENCE PROFILE</span>
        <h3>用户画像分析</h3>
        <p>{account.name || '当前账号'} · 基于内容互动信号的 Demo 推测画像</p>
      </div>
      <span className="profile-inference-badge">推测画像 · 待数据校准</span>
    </div>

    <div className="audience-primary-segment"><span>核心受众</span><strong>{profile.primarySegment}</strong></div>

    <div className="audience-profile-grid">
      <div className="audience-profile-panel audience-segments-panel"><div className="audience-panel-title"><UsersRound size={14} /><strong>人群构成</strong></div>{profile.segments.map((item) => <div className="audience-segment-row" key={item.label}><div><strong>{item.label}</strong><span>{item.detail}</span></div><b>{item.value}</b></div>)}</div>
      <div className="audience-profile-panel"><div className="audience-panel-title"><Sparkles size={14} /><strong>兴趣与内容偏好</strong></div><div className="audience-tag-list">{profile.interests.map((item) => <span key={item}>{item}</span>)}</div><div className="audience-sub-label">更容易被什么内容触发</div><ul className="audience-preference-list">{profile.contentPreferences.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="audience-profile-panel"><div className="audience-panel-title"><Clock3 size={14} /><strong>互动活跃时段</strong></div><div className="audience-time-list">{profile.activeWindows.map((item) => <div key={item.label}><div><span>{item.label}</span><b>{item.time}</b></div><i><em style={{ width: `${item.strength}%` }} /></i><strong>{item.strength ? `${item.strength}%` : '待测'}</strong></div>)}</div></div>
    </div>

    <div className="audience-profile-bottom"><div className="audience-intent"><div className="audience-panel-title"><MessageCircleMore size={14} /><strong>互动动机</strong></div><p>{profile.engagementIntent}</p></div><div className="audience-guardrail"><span>表达边界</span><p>{profile.avoid.join(' · ')}</p></div><div className="audience-next-move"><span>下一步运营建议</span><strong>{profile.nextMove}</strong></div></div>
  </section>
}

